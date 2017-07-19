import axios from "axios";
import * as vscode from "vscode";
import { DockerHubRepos } from "../dockerHubRepos";
import { Constants } from "./Constants";

export class DockerHubManager {

    private static _instance: DockerHubManager = new DockerHubManager();

    private _userName: string = "";
    private _password: string = "";
    private _token: string = "";
    private _repos: Map<string, string[]> = new Map();
    private _dockerHubTreeViewRef: DockerHubRepos;

    constructor() {
        if (DockerHubManager._instance) {
            throw new Error("Error: Invalid new DockerHubUserManager");
        }
        DockerHubManager._instance = this;
    }

    public set dockerHubTreeViewRef(ref: DockerHubRepos) {
        this._dockerHubTreeViewRef = ref;
    }

    public static get Instance(): DockerHubManager {
        return DockerHubManager._instance;
    }

    public get repos(): Map<string, string[]> {
        return this._repos;
    }

    public get userName(): string {
        return this._userName;
    }

    public login() {
        this.getUserCredential()
        .then((credential) => {
            return this.sendLoginRequest(credential[0], credential[1]);
        })
        .then(() => {
            return this.refresh();
        })
        .then(() => {
            this._dockerHubTreeViewRef._onDidChangeTreeData.fire();
        })
        .catch((error) => {
            vscode.window.showErrorMessage(error);
        });
    }

    public logout() {
        this._userName = "";
        this._password = "";
        this._token = "";
        this._repos.clear();
        this._dockerHubTreeViewRef._onDidChangeTreeData.fire();
    }

    public refresh() {
        if (!this._token || this._token.length === 0) {
            vscode.window.showErrorMessage("Please Login first");
            return;
        }
        this._repos.clear();
        this._dockerHubTreeViewRef._onDidChangeTreeData.fire();
        this.listRepositories()
        .then(() => {
            return this.listRepositories();
        })
        .then(() => {
            return this.getTagsForRepos();
        })
        .then(() => {
            this._dockerHubTreeViewRef._onDidChangeTreeData.fire();
        })
        .catch((error) => {
            vscode.window.showErrorMessage(error);
        });
    }

    private getUserCredential(): Promise<string[]> {
        const userAndPassword = [];
        return new Promise((resolve, reject) => {
            vscode.window.showInputBox({prompt: "Enter user name."})
            .then((val) => {
                if (!val || val.trim().length === 0) {
                    reject("Invalid user name.");
                    return;
                }
                userAndPassword.push(val);
                return vscode.window.showInputBox({
                    prompt: "Enter password.",
                    password: true,
                    placeHolder: "Password",
                });
            })
            .then((val) => {
                if (!val || val.trim().length === 0) {
                    reject("Invalid password.");
                    return;
                }
                userAndPassword.push(val);
                resolve(userAndPassword);
            });
        });

    }

    private sendLoginRequest(user: string, pwd: string): Promise<void> {
        return new Promise((resolve, reject) => {
            axios.post(Constants.LOGIN_URL, {
                username: user,
                password: pwd,
            })
            .then((response) => {
                if (response.data && response.data.token) {
                    this._userName = user;
                    this._token = response.data.token;
                    resolve();
                } else {
                    reject("Error: Login fail.");
                }
            })
            .catch((err) => {
                reject(err.message);
            });
        });
    }

    private listRepositories(): Promise<void> {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    "Authorization": `JWT ${this._token}`,
                    "Content-Type": "application/json",
                },
            };
            axios.post(`${Constants.REPOSITORY_URL}/${this._userName}?${Constants.PAGE_SIZE}`, {}, options)
            .then((response) => {
                const data: any = response.data;
                if (data && data.count > 0 && data.results) {
                    for (const result of data.results) {
                        this._repos.set(result.name, []);
                    }
                    resolve();
                } else {
                    reject("Error: Cannot get repositories.");
                }
            })
            .catch((err) => {
                reject(err.message);
            });
        });
    }

    private getTagsForRepos(): Promise<void> {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    "Authorization": `JWT ${this._token}`,
                    "Content-Type": "application/json",
                },
            };
            for (const key of this._repos.keys()) {
                axios.post(`${Constants.REPOSITORY_URL}/${this._userName}/${key}/tags?${Constants.PAGE_SIZE}`, {}, options)
                .then((response) => {
                    const data: any = response.data;
                    if (data && data.count > 0 && data.results) {
                        const tags = [];
                        for (const result of data.results) {
                            tags.push(result.name);
                        }
                        this._repos.set(key, tags);
                        resolve();
                    } else {
                        reject("Error: Cannot get tags.");
                    }
                })
                .catch((err) => {
                    reject(err.message);
                });
            }
        });
    }
}
