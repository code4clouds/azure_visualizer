![build status](https://travis-ci.org/code4clouds/azure_visualizer.svg?branch=master)

# Azure_Visualizer
Visualize Azure Resource Group Connections

![Azure Visualizer Image](/doc/images/AzVizReadme.png)

# Project Definition

To provide a portable tool to explore the connections between the resources of a resource group.

## These are the goals:
- Portable
- Secure 
- Maintable
- Minimalistic 

# How to run it

1. Clone this repo 

```
git clone https://github.com/code4clouds/azure_visualizer
```

2. Install Python3.5 or later

```
pip3 install -r requirements.txt
```

3. Run the app

```
python3 app.py
```

4. Connect to the site using your favorite web browser (https://127.0.0.1:5000).  

5. Login 

6. Explore

## How do I get my login credentials

You can create your service principal using the following methods:

- [WEB](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal)
- [CLI](https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli?toc=%2Fazure%2Fazure-resource-manager%2Ftoc.json&view=azure-cli-latest)

## Disable credentials on the browser

Before launching the application set the following environmental variables to remove the credentials component from the browser page.  

- TENANT_ID
- CLIENT_ID
- CLIENT_SECRET
- SUBSCRIPTION

### On Linux
Example: 
```bash
export TENANT_ID=123ABFC
```

### On Windows
Exmaple:
```
set TENANT=123abcf
```

## Notes
- This project uses a self-sign certiticate, but you can bring your own if you want a Certificate Authority (CA) protection.
