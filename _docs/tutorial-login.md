---
title: "Loging into SCA"
permalink: /docs/tutorial/login
excerpt: "local authentication"
---

{% include base_path %}

For SCA Authentication [API Doc](https://test.sca.iu.edu/auth/apidoc)

Most SCA REST APIs requires user to pass JWT token as part of the header. If user doesn't have it, they need to 
obtain it from SCA authentication APIs.

Following sample code does this by making username / password based authentication request.

```javascript
var request = require('request');
var fs = require('fs');
var jwt = require('jsonwebtoken');

//update to point to your sca instance
var sca = "https://test.sca.iu.edu/api";

function login(cb) {
    request.post({
        url: sca+"/auth/local/auth", 
        json: true,
        body: {username: "username", password: "password"}
    }, function(err, res, body) {
        if(err) throw err;
        if(res.statusCode != 200) return common.show_error(res, body);
        var token = jwt.decode(body.jwt);
        console.dir(token);
    });
}
```

If user already have the JWT token, a good way to validate the token is to request a refresh of the JWT token

```javascript
function login(cb) {

    request.post({
        url: sca+"/auth/refresh", 
        json: true,
        body: {username: "username", password: "password"}
    }, function(err, res, body) {
        if(err) throw err;
        if(res.statusCode != 200) return common.show_error(res, body);
        var token = jwt.decode(body.jwt);
        console.dir(token);
    });
}
```

JWT token is meant to last for only a few hours (configured on the server side), it's good to keep refreshing it
as long as user is actively using your application.

Once you have a valid JWT token, you can make API request by setting headers parameters on your request.

```
    headers: { 'Authorization': 'Bearer '+jwt },
```


