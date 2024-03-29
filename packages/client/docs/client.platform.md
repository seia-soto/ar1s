<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@ar1s/client](./client.md) &gt; [Platform](./client.platform.md)

## Platform class

Platform instance

**Signature:**

```typescript
export declare class Platform extends Context 
```
**Extends:** Context

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(context, params)](./client.platform._constructor_.md) |  | Constructs a new instance of the <code>Platform</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [createdAt](./client.platform.createdat.md) | <code>readonly</code> | Date |  |
|  [displayImageUrl](./client.platform.displayimageurl.md) |  | string |  |
|  [displayName](./client.platform.displayname.md) |  | string |  |
|  [flag](./client.platform.flag.md) |  | number |  |
|  [id](./client.platform.id.md) | <code>readonly</code> | number &amp; { \_\_type: 'platform.id'; } |  |
|  [inviteIdentifier](./client.platform.inviteidentifier.md) | <code>readonly</code> | string |  |
|  [isManagedByCurrentUser](./client.platform.ismanagedbycurrentuser.md) | <code>readonly</code> | boolean |  |
|  [updatedAt](./client.platform.updatedat.md) |  | Date |  |
|  [users?](./client.platform.users.md) |  | [Collection](./client.collection.md)<!-- -->&lt;[User](./client.user.md)<!-- -->&gt; | _(Optional)_ |
|  [usersRequired](./client.platform.usersrequired.md) | <code>readonly</code> | [Collection](./client.collection.md)<!-- -->&lt;[User](./client.user.md)<!-- -->&gt; |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [delete()](./client.platform.delete.md) |  | Delete current platform |
|  [sync()](./client.platform.sync.md) |  | Sync current platform |
|  [syncUsers()](./client.platform.syncusers.md) |  | Sync users of current platform |
|  [update(params)](./client.platform.update.md) |  | Update data depends on reflection object |
|  [validate(params)](./client.platform.validate.md) | <code>static</code> | Validate the reflection object |

