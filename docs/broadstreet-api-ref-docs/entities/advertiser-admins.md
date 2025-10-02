# Advertiser Admins

**Description**: User access management for advertiser-level administrative permissions.

## Operations

### Create Advertiser Admin
**Endpoint**: `POST /advertisers/{advertiser_id}/advertiser_admins`
**Auth**: API Key required
**Path Parameters**: 
- `advertiser_id` (integer, required) - Advertiser to add admin to
**Query Parameters**: 
- `user_id` (integer, required) - User to grant advertiser admin access

```bash
curl -X POST "https://api.broadstreetads.com/v1/advertisers/1/advertiser_admins?user_id=23&api_key=YOUR_API_KEY"
```

**Response**: Admin successfully added (no specific response format documented)

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `advertiser_id` | integer | Advertiser identifier |
| `user_id` | integer | User identifier |

## Admin Display in Advertiser Entity

When retrieving advertiser information, admins are included:
```json
{
  "advertiser": {
    "id": "1",
    "name": "Test Advertiser",
    "logo": {},
    "notes": null,
    "admins": [
      {
        "name": "Front Desk",
        "email": "frontdesk@broadstreeetads.com"
      }
    ]
  }
}
```

## Common Patterns

### Access Control Hierarchy
```
Advertiser Admin
├── Full advertiser management access
├── Can manage advertiser's campaigns
├── Can manage advertiser's advertisements
├── Can view advertiser's reporting
└── Cannot manage network or other advertisers
```

### Scoped Permissions
Advertiser admins have limited scope compared to network admins:
- **Can Access**: Specific advertiser's data only
- **Cannot Access**: Network settings, other advertisers, zones
- **Typical Use**: Client/advertiser self-management

### Admin Management Workflow
1. **Advertiser Creation**: Create or identify target advertiser
2. **User Identification**: Get the user_id to grant access to
3. **Permission Grant**: Add user as advertiser admin
4. **Client Onboarding**: User can now manage their advertiser account

### Integration with Advertiser Entity
Admin information appears in the advertiser object's `admins` array:
```json
{
  "admins": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### Self-Service Scenarios
Advertiser admins enable:
- **Client Portals**: Advertisers manage their own campaigns
- **Agency Workflows**: Account managers get advertiser-specific access  
- **Segregated Access**: Different users for different advertisers
- **Audit Trails**: Track who made what changes

### Best Practices

#### Admin Assignment
- Grant access only to users who need advertiser-specific management
- Use for client self-service scenarios
- Consider multiple admins per advertiser for redundancy
- Document admin roles and contact information

#### User Communication
```bash
# After adding an admin, the user typically receives:
# - Welcome email with login instructions
# - Access to advertiser dashboard
# - Documentation on available features
```

### Permissions Granted
Advertiser admins typically have access to:
- **Advertiser**: Read, update advertiser information
- **Campaigns**: Full CRUD operations for this advertiser
- **Advertisements**: Full CRUD operations for this advertiser
- **Reporting**: Analytics for this advertiser's campaigns/ads
- **Placements**: Manage placements for this advertiser's campaigns

### Permissions Denied
Advertiser admins cannot access:
- **Network Settings**: Network configuration and management
- **Other Advertisers**: Other advertisers' data or campaigns
- **Zones**: Zone creation or management (network-level)
- **Network Admins**: User management at network level

### Comparison with Network Admins

| Feature | Network Admin | Advertiser Admin |
|---------|---------------|------------------|
| Scope | Entire network | Single advertiser |
| Advertisers | All advertisers | One advertiser |
| Zones | Can manage zones | Read-only zone info |
| Campaigns | All campaigns | Own campaigns only |
| Reporting | Network-wide | Advertiser-specific |
| User Management | Network + Advertiser admins | None |

## Related Entities
- [Advertisers](./advertisers.md) - Parent entity (shows admins in response)
- [Network Admins](./network-admins.md) - Higher-level access control
- [Campaigns](./campaigns.md) - Advertiser admins can manage these
- [Advertisements](./advertisements.md) - Advertiser admins can manage these