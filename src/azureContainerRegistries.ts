import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerTreeBase } from "./dockerTreeBase";
import { Executor } from "./executor";
import { ACRHierachy } from "./Model/ACRHierachy";
import { ACRNode } from "./Model/ACRNode";
import { ACRTreeItem } from "./Model/ACRTreeItem";
import { DockerImage } from "./Model/DockerImage";
import { Utility } from "./utility";

export class AzureContainerRegistries extends DockerTreeBase<ACRTreeItem> implements vscode.TreeDataProvider<ACRTreeItem> {
    constructor(context: vscode.ExtensionContext) {
        super(context);
    }
    public login() {
        Executor.runInTerminal(`docker run -it --name azure-cli azuresdk/azure-cli-python`, true, 'Azure CLI');


        Executor.runInTerminal(`docker exec azure-cli az login`, true, 'Azure CLI');
    }

    public logout() {
        Executor.runInTerminal(`docker exec azure-cli az logout`, true, 'Azure CLI');
    }

    public getTreeItem(element: ACRTreeItem): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: ACRTreeItem): Thenable<ACRTreeItem[]> {
        if (element === undefined) {
            // root
            const ret = [];
            let regs = [];
            ACRHierachy.root.children.length = 0;
            try {
                regs = JSON.parse(Executor.execSync(`docker exec azure-cli az acr list`));
            } catch (error) {
                const item = new ACRTreeItem(new ACRNode("Please Login first.", [], null, "root"), "root");
                ret.push(item);
                this.login();
            }
            for (const reg of regs) {
                const item = new ACRTreeItem(new ACRNode(reg.name, [], ACRHierachy.root, "registry"), "registry");
                item.collapsibleState = 1;
                ACRHierachy.root.children.push(item.node);
                ret.push(item);
            }
            return Promise.resolve(ret);
        } else if (element.node.type === "registry") {
            const ret = [];
            const images = JSON.parse(Executor.execSync(`docker exec azure-cli az acr repository list -n ${element.node.name}`))
            for (const imageName of images) {
                const item = new ACRTreeItem(new ACRNode(imageName, [], element.node, "repository"), "repository");
                item.collapsibleState = 1;
                element.node.children.push(item.node);
                ret.push(item);
            }
            return Promise.resolve(ret);
        } else if (element.node.type === "repository") {
            const ret = [];
            const tags = JSON.parse(Executor.execSync(`docker exec azure-cli az acr repository show-tags --name ${element.node.parent.name} --repository ${element.node.name}`))
            for (const tag of tags) {
                const item = new ACRTreeItem(new ACRNode(tag, [], element.node, "tag"), "tag");
                element.node.children.push(item.node);
                ret.push(item);
            }
            return Promise.resolve(ret);
        } else if (element.node.type === "tag") {
            return Promise.resolve(null);
        }
    }

    public pullImage(tag: string, repository: string, registry: string): void {
        if (tag && repository && registry) {
            const credential = Executor.execSync(`docker exec azure-cli az acr credential show -n ${registry}`);
            const credentialObj = JSON.parse(credential);
            const password = credentialObj.passwords[0].value;
            const loginResult = Executor.execSync(`docker login ${registry}.azurecr.io -u ${registry} -p ${password}`);
            if (loginResult.indexOf("Login Succeeded") >= 0) {
                Executor.runInTerminal(`docker pull ${registry}.azurecr.io/${repository}:${tag}`);
            }
        }
    }

    public deployToAzure(tag: string, repository: string, registry: string) {
        if (tag && repository && registry) {
            const timestamp = Date.now();
            const appName = `webapponlinux-${timestamp}`;
            const appServicePlan = `AppServiceLinuxDockerPlan${timestamp}`
            const resourceGroup = `rg-webapp-${timestamp}`;
            const location = "WestUS";
            const serverUrl = `${registry}.azurecr.io`;
            const dockerContainerPath = `${serverUrl}/${repository}:${tag}`;

            const credential = Executor.execSync(`az acr credential show -n ${registry}`);
            const credentialObj = JSON.parse(credential);
            const password = credentialObj.passwords[0].value;

            // Create a Resource Group
            Executor.runInTerminal(`docker exec azure-cli az group create --name ${resourceGroup} --location ${location}`, true, 'Azure CLI');
            // Create an App Service Plan
            Executor.runInTerminal(`docker exec azure-cli az appservice plan create --name ${appServicePlan} --resource-group ${resourceGroup} --location ${location} --is-linux --sku S1`, true, 'Azure CLI');
            // Create a Web App
            Executor.runInTerminal(`docker exec azure-cli az webapp create --name ${appName} --plan ${appServicePlan} --resource-group ${resourceGroup}`, true, 'Azure CLI');
            // Configure Web App with a Custom Docker Container from Docker Hub
            Executor.runInTerminal(`docker exec azure-cli az webapp config container set --docker-custom-image-name ${dockerContainerPath} --docker-registry-server-password ${password} --docker-registry-server-url ${serverUrl} --docker-registry-server-user ${registry} --name ${appName} --resource-group ${resourceGroup}`, true, 'Azure CLI');

            // Sync output Web URL
            Executor.runInTerminal(`echo "Web App is deployed to http://${appName}.azurewebsites.net/"`, true, 'Azure CLI');
        }
    }
}
