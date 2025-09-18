import connectDB from './mongodb';
import Theme from './models/theme';
import Zone from './models/zone';

export interface ThemeValidationResult {
  success: boolean;
  totalThemes: number;
  validatedThemes: number;
  invalidZonesRemoved: number;
  emptyThemesCount: number;
  errors: string[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface ValidationStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress?: number;
  currentTheme?: string;
  result?: ThemeValidationResult;
  error?: string;
  startedAt?: Date;
}

class ThemeValidationService {
  private currentStatus: ValidationStatus = { status: 'idle' };
  private validationPromise: Promise<ThemeValidationResult> | null = null;

  /**
   * Get current validation status
   */
  getStatus(): ValidationStatus {
    return { ...this.currentStatus };
  }

  /**
   * Start theme validation process
   */
  async startValidation(): Promise<ThemeValidationResult> {
    if (this.currentStatus.status === 'running') {
      throw new Error('Theme validation is already running');
    }

    this.currentStatus = {
      status: 'running',
      progress: 0,
      startedAt: new Date()
    };

    try {
      this.validationPromise = this.performValidation();
      const result = await this.validationPromise;
      
      this.currentStatus = {
        status: 'completed',
        progress: 100,
        result,
        startedAt: this.currentStatus.startedAt
      };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      this.currentStatus = {
        status: 'error',
        error: errorMessage,
        startedAt: this.currentStatus.startedAt
      };
      throw error;
    } finally {
      this.validationPromise = null;
    }
  }

  /**
   * Perform the actual theme validation
   */
  private async performValidation(): Promise<ThemeValidationResult> {
    const startTime = new Date();
    const result: ThemeValidationResult = {
      success: false,
      totalThemes: 0,
      validatedThemes: 0,
      invalidZonesRemoved: 0,
      emptyThemesCount: 0,
      errors: [],
      duration: 0,
      startTime,
      endTime: new Date()
    };

    try {
      await connectDB();

      // Get all themes
      const themes = await Theme.find({}).lean();
      result.totalThemes = themes.length;

      if (themes.length === 0) {
        result.success = true;
        result.endTime = new Date();
        result.duration = result.endTime.getTime() - startTime.getTime();
        return result;
      }

      // Get all valid zone IDs from the zones collection
      const validZones = await Zone.find({}, { broadstreet_id: 1 }).lean();
      const validZoneIds = new Set(validZones.map(zone => zone.broadstreet_id));

      console.log(`[ThemeValidation] Found ${validZoneIds.size} valid zones in database`);

      // Process each theme
      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i];
        
        // Update progress
        this.currentStatus.progress = Math.round((i / themes.length) * 100);
        this.currentStatus.currentTheme = theme.name;

        try {
          const originalZoneCount = theme.zone_ids?.length || 0;
          
          // Filter out invalid zone IDs
          const validZoneIdsForTheme = (theme.zone_ids || []).filter((zoneId: number) =>
            validZoneIds.has(zoneId)
          );

          const removedCount = originalZoneCount - validZoneIdsForTheme.length;
          result.invalidZonesRemoved += removedCount;

          if (removedCount > 0) {
            console.log(`[ThemeValidation] Theme "${theme.name}": removed ${removedCount} invalid zones`);
          }

          // Update theme with valid zones only
          await Theme.findByIdAndUpdate(theme._id, {
            zone_ids: validZoneIdsForTheme
          });

          // Count empty themes
          if (validZoneIdsForTheme.length === 0) {
            result.emptyThemesCount++;
          }

          result.validatedThemes++;

        } catch (error) {
          const errorMsg = `Failed to validate theme "${theme.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[ThemeValidation] ${errorMsg}`);
        }
      }

      result.success = result.errors.length === 0;
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();

      console.log(`[ThemeValidation] Completed: ${result.validatedThemes}/${result.totalThemes} themes validated, ${result.invalidZonesRemoved} invalid zones removed, ${result.emptyThemesCount} empty themes`);

      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown validation error';
      result.errors.push(errorMsg);
      result.success = false;
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();
      
      console.error(`[ThemeValidation] Fatal error: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Reset validation status
   */
  reset(): void {
    this.currentStatus = { status: 'idle' };
    this.validationPromise = null;
  }
}

// Export singleton instance
export const themeValidationService = new ThemeValidationService();
