---
title: "Workflow Instance"
permalink: /docs/tutorial/instance
excerpt: "Create / query new workflow instance"
---

{% include base_path %}

For SCA Workflow [API Doc](https://test.sca.iu.edu/wf/apidoc)

Before you can start submitting a task, you will need a workflow instance to store the task in. You can think of workflow instance as a 
directory to store various tasks that are related. Tasks inside workflow instance can share data products, and helps organize the workflow.

To create a new workflow instance, do something like following.

```
var request = require('request');
var fs = require('fs');
var sca = "https://test.sca.iu.edu/api";

//update to point to your sca jwt (see login page for more info)
var jwt = fs.readFileSync('/home/hayashis/.sca/keys/cli.jwt', {encoding: 'ascii'}).trim();

request.post({
    url: sca+"/wf/instance",
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
    body: {
        workflow_id: 'sca-wf-backup',
        name: 'test123',
        desc: 'You can add description.',
    }, 
    headers: auth_headers,
}, function(err, res, body) {
    if(err) throw err;
    if(res.statusCode != 200) throw new Error(body);
    console.dir(body);
});

```

workflow_id is set to sca-wf-backup in order to indicate that this instance belongs to sca-wf-backup workflow.

You can query existing instances like so..

```
request.get({
    url: sca+"/wf/instance",
    json: true,
    headers: auth_headers,
    qs: {where: JSON.stringify({workflow_id: 'sca-wf-backup'})},
}, function(err, res, instances) {
    if(err) throw err;
    if(res.statusCode != 200) throw new Error(instances);
    console.dir(instances);
    
});
```


