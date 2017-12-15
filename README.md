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

5. Login with your login token

6. Explore


## Disable credentials on the client mode (group dashboard)

Set the following environmental variable to remove the credentials component from the page.

- TENANT_ID
- CLIENT_ID
- CLIENT_SECRET
- SUBSCRIPTION


## Notes
- This project uses a self-sign certiticate, but you can bring your own if you want a Certificate Authority (CA) protection.
