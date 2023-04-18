<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@ar1s/client](./client.md) &gt; [Aris](./client.aris.md) &gt; [bootstrap](./client.aris.bootstrap.md)

## Aris.bootstrap() method

Bootstrap the instance

**Signature:**

```typescript
bootstrap(params: {
        platformInviteIdentifier: Platform['inviteIdentifier'];
        platformDisplayName: Platform['displayName'];
        platformToken: string;
        userUsername: User['username'];
        userPassword: string;
    }): Promise<this>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  params | { platformInviteIdentifier: [Platform](./client.platform.md)<!-- -->\['inviteIdentifier'\]; platformDisplayName: [Platform](./client.platform.md)<!-- -->\['displayName'\]; platformToken: string; userUsername: [User](./client.user.md)<!-- -->\['username'\]; userPassword: string; } | Bootstrap params |

**Returns:**

Promise&lt;this&gt;

this
