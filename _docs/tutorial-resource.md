---
title: "Workflow Resource"
permalink: /docs/tutorial/resource
excerpt: "Register / update resource entries"
---

{% include base_path %}

> Using APIs provided by [SCA Workflow Service API](https://test.sca.iu.edu/wf/apidoc)

Before user can submit tasks, they need a resource (PBS cluster, or any machine that user has SSH access) 
where they can submit the task. User needs to register resource once - normally during the account registration phase.

## SSH Resource

SCA uses SSH key pair to access most resources. To register a resource like a campus cluster (karst), you will
need to generate SSH keypair (using a tool like ssh-kengen) or use SCA's keygen API which generates the keypair
that is compatible for SCA resource API. This API does not require JWT.

```javascript
'use strict';

var request = require('request');
var fs = require('fs');

var sca = "https://test.sca.iu.edu/api";

//register new user
//using SCA local username and password
request.get({
    url: sca+"/wf/resource/gensshkey",
    json: true,
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});

```

This API returns an object containing public and private key.

```json
{ 
    "pubkey": "ssh-rsa ............",
    "key": "-----BEGIN RSA PRIVATE KEY------\n.................",
}
```

Once you have the keypair, you should try installing it under user's `~/.ssh/authorized_keys` with user/pass provided
by the user.

```javascript
request.post({
    url: sca+"/wf/resource/installsshkey",
    json: true,
    body: {
        username: "foouser",
        password: "_foouser_password_",
        host: "karst.uits.iu.edu",

        comment: "key used by sca to access karst",
        pubkey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDmVF2IWVhsehiY+l2wJJxtREUIZLGIExnTI7c1w98HB1pmwaIkOKHTEGgGPK6ktqGbFMz1qpMi8VlOlpcGo7BZ7ptlbknxk43rFfDtxyU++ZZcfKJXSMo1/F8XZaqdETtCsJ2IQ59b3tlF0gVRcY24dLDWMxDW/s4q64tanHpwa1zRD57pnsGO+UO4/WykTvG9LaoMVGEb8FThB8Wh1ntV89qWIACb1ArrKT9Z5yn8RE22DKysh7Cze5Lbq9yl/mzHf5gVrTx5wPFuQHwQ2KUt1Jk0Ky4NS8GY2CjYALq4/G9kOxvf3YK2oIsL31WA2D79k5g4uPdJ8aoMGWu7hO5z",
    }
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});

```

If the installation is successful, then you can register a new resource through `POST:/wf/resource/` API.

```javascript
'use strict';

var request = require('request');
var fs = require('fs');

var sca = "https://test.sca.iu.edu/api";
var jwt = fs.readFileSync('my.jwt', {encoding: 'ascii'}).trim();

request.post({
    url: sca+"/wf/resource",
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
    body: {
        type: "pbs",
        resource_id: "karst",
        name: "use foo's karst account",
        config: {
            "username": "foo",
            "enc_ssh_private": "............................ssh private key..............................",
            "ssh_public": "............................ssh public key..............................",
        },
    }
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});

```

Once you have registerd the resource, you should run a test to make sure SCA can actually access the resource. 

Using the resource._id obtained when you registered the resource, you can run `PUT:/wf/test/:resource_id`

```javascript
request.put({
    url: sca+"/wf/resource/test/"+resource._id,
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});
```

You should receive `"status": "ok"` in response. If not, you will see `"message"` set to an error message.

For more comprehensive sample code, please see [AutoconfController](https://github.com/soichih/sca-wf/blob/master/ui/js/controllers.js#L452) for SCA WF UI


## SDA resource

The only difference between registering SSH resource and SDA resource is that, you will be configuring kerberos keytab
instead of the SSH key pair. Similar to SSH keypair, you can generate the keytab yourself, or use SCA's /setkeytab API.

To use /setkeytab, though, you first need a resource to set the keytab on.. So, create a new resource 
without the actual keytab.

```javascript
request.post({
    url: sca+"/wf/resource",
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
    body: {
        type: "hpss",
        resource_id: "sda",
        name: "use hpss keytab",
        config: {
            "auth_method": "keytab",
            "username": "username",
            "enc_keytab": "", //will be set by /setkeytab API later
        },
    }
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});

```

Then, using the new resource._id returned, call /setkeytab API.

```javascript
request.post({
    url: sca+"/wf/resource/setkeytab/"+resource._id,
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
    body: {
        username: "userfoo",
        password: "user_password_for_userfoo",
    }
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});

```

This API creates a new kerberos keytab using provided username / password, and base64 encode it and store it under
config.enc_keytab field for the resource.

If you receive return code 200, you should be good to go.

> Currently, /resource/test does not work for SDA resource (TODO..)

## Update resource

You can update resource using `PUT:/wf/resource/:resource_id` API (such as to disable a resource)

```javascript
request.put({
    url: sca+"/wf/resource/"+resource._id,
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
    body: {
        active: false,         
        //you can set config / envs / name, gids, etc..
    }
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});
```

## Delete resource

If you want to completely remove a resource, just make a delete request for specific resource._id

```javascript
request.delete({
    url: sca+"/wf/resource/"+resource._id,
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
}, function(err, res, body) {
    if(err) throw err;
    console.dir(body);
});
```

