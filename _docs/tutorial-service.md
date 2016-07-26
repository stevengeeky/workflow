---
title: "Creating SCA service"
permalink: /docs/tutorial/service
excerpt: "Create and register SCA service"
---

{% include base_path %}

Services are any software that is executed by SCA workflow service on a resource where user has ssh access to. 
Service can be a bash script to submit a PBS job on a local cluster, or executable to run on specific VM, or even 
run a docker container on a docker host.

This tutorial will walk you through the step of creating, registering your service.

Before we begin, please make sure that you have registered your account in SCA, and configured at least one
resource where your service will be running. If you haven't done this yet, please head to https://test.sca.iu.edu/wf/#/resources (contact Soichi Hayashi <hayashis@iu.edu> if you need any help)

All SCA services needs to be published on github so that SCA workflow service can clone / update the repository on a 
resource where the service is executed. To get started, first create a new github repo.

![Create repo]({{base_path}}/images/tutorial/github_create.png)

Then, clone the new repo where you will be editing your service. You can edit it using github.com web UI if you 
don't know how.

```bash
$ git clone git@github.com:soichih/sca-service-helloworld1.git
Cloning into 'sca-service-helloworld1'...
warning: You appear to have cloned an empty repository.
Checking connectivity... done.

$ cd sca-service-helloworld1

```

All SCA service must have package.json which contains basic metadata about this service. You can either run `npm init`
if you have npm installed, or you can manually create with something like following template.

```json
{
  "name": "sca-service-helloworld1",
  "version": "1.0.0",
  "description": "SCA Test Service",
  "scripts": {
    "run": "run.sh"
  }
}

```

In package.json, we tell SCA various `hooks` that it can execute to perform certain tasks. SCA currently supports 
following hooks

- run: Execute a service synchronously. SCA will run specified script upon startup and wait for it to finish.

- start: Start a service asynchronously. If your service involves submitting a job to PBS cluster, or spawning a long running task, use start hook.
- status: If you are using start instead of run, SCA needs a way to determine the current state of your service. status script should return following exit codes

  0: service running
  1: service finished successfully
  2: service failed

- stop: This is also needed if you are using start hook. It is needed in case use request your service to be terminated.

In this tutorial, we will be using run.sh for simplicity.

Create run.sh with something like following content.

```bash
#!/bin/bash
echo "running hello world service"
sleep 10
whoami
date
hostname

echo "output" > output.txt

echo "[]" > products.json
```

> Please make sure to `chmod +x run.sh`. 

Our run.sh simply outputs some info and write out output.txt to simulate some data output.
It also outputs a file named `products.json`, which is another required file for all SCA services. This file
tells what data products are generated when the service completes successfully. This information is then used by dependent
services to discover what input files are available from previous steps.

Now, add both pakcage.json and run.sh to git and commit & push to remote repo.

```bash
git add package.json
git add run.sh
git commit -m "initial commit"
git push -u origin master
```

Next, we need to register your new service on SCA (needs to be done only once) so that SCA knows about your service. We
also need to configure SCA resource settings so that your service will run on specific resource. Currently, only the
administrator of SCA server can do this configuration. For now, please contact Soichi Hayashi <hayashis@iu.edu> and 
give him following information.

1. The URL to your git repo (like https://github.com/soichih/sca-service-helloworld1)
2. The URL for the SCA server instance (like https://test.sca.iu.edu)
3. Name of the resource where you want your service to run (Karst, Bigred2, etc..)

> Notes for Admin 
> pub-test1: /usr/local/sca-wf/config/resources.js
> pub-test1: /usr/local/sca-cli/test/register_services.sh

> TODO: Create a simple WF UI where user can submit any service with any config (under workflow_id: "test" or such)


