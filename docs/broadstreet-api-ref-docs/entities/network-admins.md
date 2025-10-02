# Network Admins

**Description**: User access management for network-level administrative permissions.

## Operations

### Create Network Admin
**Endpoint**: `POST /networks/{network_id}/network_admins`
**Auth**: API Key required
**Path Parameters**: 
- `network_id` (integer, required) - Network to add admin to
**Query Parameters**: 
- `user_id` (integer, required) - User to grant network admin access

```bash
curl -X POST "https://api.broadstreetads.com/v1/networks/1/network_admins?user_id=23&api_key=YOUR_API_KEY"
```

**Response**: Admin successfully added (no specific response format documented)

### Remove Network Admin
**Endpoint**: `DELETE /networks/{network_id}/network_admins`
**Auth**: API Key required
**Path Parameters**: 
- `network_id` (integer, required) - Network to remove admin from
**Query Parameters**: 
- `user_id` (integer, required) - User to remove network admin access from

```bash
curl -X DELETE "https://api.broadstreetads.com/v1/networks/1/network_admins?user_id=23&api_key=YOUR_API_KEY"
```

**Response (200)**: Admin successfully removed
**Response (400)**: Cannot abandon network
```json
{
  "message": "cannot abandon network"
}
```

## Entity Properties

| Property | Type | Description |
|----------|------|-------------|
| `network_id` | integer | Network identifier |
| `user_id` | integer | User identifier |

## Common Patterns

### Access Control Hierarchy
```
Network Admin
├── Full network management access
├── Can manage all advertisers in network
├── Can manage all zones in network
├── Can view all campaigns and reporting
└── Can manage other network admins
```

### Admin Management Workflow
1. **User Creation**: Ensure user exists in the system
2. **Permission Grant**: Add user as network admin
3. **Verification**: User can now access network resources
4. **Maintenance**: Remove access when no longer needed

### Error Handling

#### Cannot Abandon Network
The "cannot abandon network" error occurs when:
- Trying to remove the last admin from a network
- The user is the network owner/creator
- System prevents leaving networks without admins

**Solution**: Add another admin before removing the current one

### Best Practices

#### Admin Management
- Always have at least 2 admins per network for redundancy
- Document admin roles and responsibilities
- Regular audit of admin access
- Remove access promptly when users leave

#### User Management
```bash
# Add backup admin before removing primary
curl -X POST ".../network_admins?user_id=BACKUP_USER&..."
curl -X DELETE ".../network_admins?user_id=PRIMARY_USER&..."
```

### Permissions Granted
Network admins typically have access to:
- **Networks**: Read, update network settings
- **Advertisers**: Full CRUD operations
- **Zones**: Full CRUD operations
- **Campaigns**: Full CRUD operations (via advertiser access)
- **Advertisements**: Full CRUD operations (via advertiser access)
- **Reporting**: Full access to network-level analytics
- **Admin Management**: Add/remove other network admins

### Integration with User System
Network admin management assumes:
- Users exist in the broader Broadstreet user system
- `user_id` references are valid user accounts
- Users have appropriate authentication credentials
- User permissions are enforced by the API

## Related Entities
- [Networks](./networks.md) - Parent entity
- [Advertiser Admins](./advertiser-admins.md) - Similar access control for advertisers
- [Advertisers](./advertisers.md) - Network admins can manage these
- [Zones](./zones.md) - Network admins can manage these