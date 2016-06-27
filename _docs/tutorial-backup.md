---
title: "Backing up local directory to HPSS"
permalink: /docs/tutorial/backup
excerpt: "Submit requests to backup a local directory"
---

{% include base_path %}

This tutorial will walk you through the steps necessary to backup any local (to a resource) directory and 
push it to HPSS.

Prerequisites

* SCA Authentication JWT
* SCA Instance ID to store your tasks

TODO: Add links to fulfill these..

**Step 1:** Query for required resources (SDA, and Karst)

In order to backup local directory on Karst, we need to make sure that user has access to SDA and karst. We can
do following to query for user's resources registered on SCA.

```javascript
var request = require('request');
var fs = require('fs');

var sca = "https://test.sca.iu.edu/api";

//update to point to your sca jwt
var jwt = fs.readFileSync('/home/hayashis/.sca/keys/cli.jwt', {encoding: 'ascii'}).trim();

function get_resources(cb) {
    request.get({
        url: sca+"/sca/resource",
        json: true,
        headers: { 'Authorization': 'Bearer '+jwt },
        qs: {
            find: JSON.stringify({resource_id: {$in: ['sda', 'karst']}})
        }
    }, function(err, res, resources) {
        if(err) return cb(err);

        var sda_resource = null;
        var karst_resource = null;

        //go through found resources and find any sda / karst resources
        //in most cases, you should pick *best* resource based on the wf need.
        resources.forEach(function(resource) {
            if(resource.resource_id == "sda") sda_resource = resource;
            if(resource.resource_id == "karst") karst_resource = resource;
        });
        cb(null, sda_resource, karst_resource);
    });
}

```

**Step 2:** Submit sca-product-raw/tar request

Now that we know user's SDA/karst resource, we can submit a request to tar up the directory.

```javascript

function submit_tar(sda_resource, src_dir, cb) {
    request.post({
        url: sca+"/sca/task",
        json: true,
        headers: { 'Authorization': 'Bearer '+jwt },
        body: {
            instance_id: instance_id,
            service: "soichih/sca-product-raw",
            preferred_resource_id: sda_resource._id, //not really needed but in case there are more than 1..
            config: {
                tar: [
                    {src: src_dir, dest: "backup.tar.gz", opts: "gz"}
                ]
            },
        }
    }, function(err, res, body) {
        if(err) throw err;
        console.log(body.message); //should be "Task successfully submitted"
        cb(null, body.task);
    });
}

```

preferred_resource_id is optional, but if user has more than 1 resource that can run sca-product-raw service, 
we don't know where this task is submitted. In our case, we want to make sure that it always run on karst (since
this tool will run against karst's local directory). We can make sure that SCA will pick karst by specifying it 
in the request body.

Once the tar task is submitted, you will receive the task object through cb()

```json
{ __v: 0,
  status_msg: 'Waiting to be processed by SCA task handler',
  request_date: '2016-06-27T18:18:57.091Z',
  status: 'requested',
  progress_key: '_sca.5716ae31d43e9a2e1649e927.57716e11b4a23255761fd728',
  user_id: '1',
  instance_id: '5716ae31d43e9a2e1649e927',
  service: 'soichih/sca-product-raw',
  preferred_resource_id: '5760192fa6b6070a731af133',
  config: { tar: [ [Object] ] },
  _id: '57716e11b4a23255761fd728',
  create_date: '2016-06-27T18:18:57.086Z',
  resource_deps: [],
  deps: [] }
```

Once you have the _id from tar task, you can submit the hpss task using this _id as a task dependency so that
hpss task will be executed *after* tarring task is successfully completed.

**Step 3:** Submit sca-service-hpss task

Submitting hpss task is bit more complicated.

```javascript
function submit_hpss(karst_resource, sda_resource, tar_task, cb) {
    request.post({
        url: sca+"/sca/task",
        json: true,
        headers: { 'Authorization': 'Bearer '+jwt },
        body: {
            instance_id: instance_id,
            service: "soichih/sca-service-hpss",
            preferred_resource_id: karst_resource._id, //not really needed but in case there are more than 1..
            deps: [tar_task._id],
            resource_deps: [sda_resource._id],
            config: {
                put: [
                    {localdir:"../"+tar_task._id+"/backup.tar.gz", hpsspath:"backup/test.fits"}
                ],
                auth: {
                    username: sda_resource.config.username,
                    keytab: sda_resource._id+".keytab",
                },
                //add a bit of extra info.. to help querying via backiup cli
                info: {
                    /*
                    hostname: os.hostname(),
                    //platform: os.platform(), //bit redundant with os.type()
                    release: os.release(),
                    type: os.type(),
                    path: process.cwd()+"/"+dir,
                    files: fs.readdirSync(dir),
                    */
                }
            },
        }
    }, function(err, res, body) {
        if(err) throw err;
        console.log(body.message); //should be "Task successfully submitted"
        cb(null, body.task);
    });
}

```

First of all, we have "deps:" set to tar_task._id. It also has 

```
    resource_deps: [sda_resource._id]
```

This tells SCA to stage the keytab required to access user's SDA resource on the submitted resource.

Finally, inside the sca-service-hpss config, we have

```json
    auth: {
        username: sda_resource.config.username,
        keytab: sda_resource._id+".keytab",
    },
```

This tells sca-service-hpss service (not SCA) how to find the keytab and username used to access user's hpss account.  This is a
service specific behavior (not part of SCA). Some service may use environment parameters to receive such information.

Rest of the configuration should look similar to tar task. It sets instance_id / service name to submit, and 
preferred_resource_id set to karst_resource. config tells where the files to be uploaded to HPSS should live. It also has
*info* parameters. This can be set to any number of parameters about this backup job so that we can query this job later on.

Once submitted,  you should receive the new task object via cb()

```json
{ __v: 0,
  status_msg: 'Waiting to be processed by SCA task handler',
  request_date: '2016-06-27T18:32:23.311Z',
  status: 'requested',
  progress_key: '_sca.5716ae31d43e9a2e1649e927.57717137b4a23255761fd72a',
  user_id: '1',
  instance_id: '5716ae31d43e9a2e1649e927',
  service: 'soichih/sca-service-hpss',
  preferred_resource_id: '575ee815b62439c67b693b85',
  config: 
   { auth: 
      { keytab: '5760192fa6b6070a731af133.keytab',
        username: 'hayashis' },
     put: [ [Object] ] },
  _id: '57717137b4a23255761fd72a',
  create_date: '2016-06-27T18:32:23.309Z',
  resource_deps: [ '5760192fa6b6070a731af133' ],
  deps: [ '57717137b4a23255761fd729' ] }

```

**Step 4:** Progress / task update

Once you have submitted your task, you can query task update via sca cli by passing the task id

```
$ sca task show 57717137b4a23255761fd72a
[
    {
        "_id": "57717137b4a23255761fd72a",
        "status_msg": "Waiting on dependency",
        "request_date": "2016-06-27T18:32:23.311Z",
        "status": "requested",
        "progress_key": "_sca.5716ae31d43e9a2e1649e927.57717137b4a23255761fd72a",
        "user_id": "1",
        "instance_id": "5716ae31d43e9a2e1649e927",
        "service": "soichih/sca-service-hpss",
        "preferred_resource_id": "575ee815b62439c67b693b85",
        "config": {
            "put": [
                {
                    "localdir": "../57717137b4a23255761fd729/backup.tar.gz",
                    "hpsspath": "backup/test.fits"
                }
            ],
            "auth": {
                "username": "hayashis",
                "keytab": "5760192fa6b6070a731af133.keytab"
            }
        },
        "__v": 0,
        "create_date": "2016-06-27T18:32:23.309Z",
        "resource_deps": [
            "5760192fa6b6070a731af133"
        ],
        "deps": [
            "57717137b4a23255761fd729"
        ]
    }
]

```

"status_msg": "Waiting on dependency" means this hpss job is still waiting on the tar task to complete. 

You can query task update via sca API directly also.

```javascript
    request.get({
        url: sca+"/sca/task",
        json: true,
        qs: {where: JSON.stringify({_id: taskid})},
        headers: { 'Authorization': 'Bearer '+jwt }
    }, function(err, res, body) {
        if(err) throw err;
        if(res.statusCode != 200) return common.show_error(res, body);
        console.log(JSON.stringify(body, null, 4));
    });

```

You can poll task update periodically, or you can redirect user to SCA progress service. 

> https://test.sca.iu.edu/progress/#/detail/_sca.<instance_id>.<task_id>

Replace instance_id and task_id.

SCA progress service receives a detailed job / task progress information while task status / status_msg are updated
less frequently.

You can also create your own progress UI by polling progress detail from following API

> https://test.sca.iu.edu/api/progress/status/_sca.<instance_id>.<task_id>?depth=2

?depth=2 tells progress service how deep you'd like to query for nested details.

Instead of polling, you can also receive realtime progress update via socket.io (progress service's default UI uses this)
Please see document on progress service for more detail.

**Step 5:** Debugging / Development

## Rerunning a task

Sometimes task fails due a resource having some issues, or temporarly network outage, etc.. If you'd like to rerun previously
submitted task instead of submitting a new one, you can make a rerun request.

```
sca task rerun 57717137b4a23255761fd729
```

or via the API..

```javascript
    request.put({
        url: sca+"/sca/task/rerun/"+task._id,
        json: true,
        headers: { 'Authorization': 'Bearer '+jwt }
    }, function(err, res, body) {
        if(err) throw err;
        if(res.statusCode != 200) return common.show_error(res, body);
        console.log(JSON.stringify(body, null, 4));
    });

```

## Accessing workflow directory

Often you need to access SCA work directory to see what's happening on the resource. For karst, work directory is configured
to use following directory pattern

`/N/dc2/scratch/__username__/sca/workflows`

Under this directory, you will find a list of all SCA instances, and for each instance directory a list of task directory.
For example, for user:hayashis, and instance_id:123456 and task id:abcdefg, the task directory is.

`/N/dc2/scratch/hayashis/sca/workflows/123456/abcdefg`

Inside the task directory, you should find config.json which is the config parameter you have send via the API, and 
_boot.sh which you can run on the task directory in order to *run* the task as SCA would run. You can run _boot.sh without
any arguments.

The SCA service scripts are stored in ~/.sca/services on each resource - instead of each task directory in order to avoid 
duplicate copies made for each tasks / instances.

