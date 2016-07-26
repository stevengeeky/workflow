---
title: "Restoring content from hpss"
permalink: /docs/tutorial/backup2
excerpt: "Continued from the backup tutorial"
---

{% include base_path %}

** continued from the backup tutorial

This tutorial goes through some APIs necessary to restore content from the HPSS.

First, let's query for previous backups. Again, you need to know the instance_id.

```javascript
var instance_id = "5716ae31d43e9a2e1649e927";

request.get({
    url: sca+"/wf/task",
    json: true,
    headers: { 'Authorization': 'Bearer '+jwt },
    qs: {
        find: JSON.stringify({
            instance_id: instance_id
            name: "backup",
        })
    }
}, function(err, res, tasks) {
    if(err) return cb(err);
    if(res.statusCode != "200") return cb("request failed with code:"+res.statusCode);
    console.log(JSON.stringify(tasks, null, 4));
});

```

This shows all backups that successfully staged to hpss. You can add more query to filter them out. Like, if you want to display completed backups with tag:test, 

```javascript
    find: JSON.stringify({
        instance_id: instance_id
        name: "backup",
        status: "finished",
        "config.info.tags": {$in: ["test"]},
    })
```

Once you decide which backup to restore, you can pull the hpss path from products object inside the task.

```json
    "products": [
        {
            "files": [
                {
                    "path": "backup/57768bff194dc13a1726385b.tar.gz",
                    "type": "application/octet-stream",
                    "size": 635797
                }
            ],
            "type": "hpss"
        }
    ],
``` 

You also want to know which HPSS resource was used to store this.

```json
   "config": {
        "auth": {
            "username": "hayashis",
            "keytab": "5760192fa6b6070a731af133.keytab"
        },
    ...
    }
```

You can also find out which karst resource was used to submit this task.

```json
    "resource_id": "575ee815b62439c67b693b85",
```

With all this information from the task object, you can now construct a request for soichih/sca-service-hpss service to *thaw* the backup.tar.gz from HPSS.

```javascript
function submit_restore(backup_task, cb) {
    var hpss_path = backup_task.products[0].files[0].path;
    request.post({
        url: sca+"/sca/task",
        json: true,
        headers: { 'Authorization': 'Bearer '+jwt },
        body: {
            instance_id: instance_id,
            name: "restore", //not needed but ..
            service: "soichih/sca-service-hpss",
            preferred_resource_id: backup_task.resource_id, //use the same karst resource we used to backup
            resource_deps: backup_Task.resource_deps, //use the same SDA resource we used
            config: {
                auth: backup_task.config.auth,
                get: [
                    {localdir:".", hpsspath:hpss_path}
                ],
            },
        }
    }, function(err, res, body) {
        if(err) return cb(err);
        console.log(JSON.stringify(body.message, null, 4)); //should be "Task successfully submitted"
        cb(null, body.task);
    });
}
```

Once I have submitted the restore task, I can then submit untar request using sca-product-raw.

```javascript

var karst_resource_id = task.resource_id;

//get filename using basename of hpss_path used to store it.
var hpss_path = task.products[0].files[0].path;
var fname = path.basename(hpss_path);

submit_untar(karst_resource_id, fname, restore_task, function(err, untar_task) {
    if(err) throw err;
    console.dir(untar_task);
});

function submit_untar(karst_resource_id, fname, hpss_task, cb) {
    request.post({
        url: sca+"/sca/task",
        json: true,
        headers: { 'Authorization': 'Bearer '+jwt },
        body: {
            instance_id: instance_id,
            service: "soichih/sca-product-raw",
            preferred_resource_id: karst_resource_id, //use the same karst resource we used to backup
            deps: [ hpss_task._id ],
            config: {
                untar: [
                    {src: "../"+hpss_task._id+"/"+fname, dest: "/N/u/hayashis/Karst/tmp", opts: "gz"}
                ]
            },
        }
    }, function(err, res, body) {
        if(err) return cb(err);
        console.log(JSON.stringify(body.message, null, 4)); //should be "Task successfully submitted"
        cb(null, body.task);
    });
}
```

You need to update the dest directory for untar request to where you want to untar the .tar.gz. to be restored. soichih/sca-product-raw service uses python's tarfile module, and it simply overwrites all existing files.


