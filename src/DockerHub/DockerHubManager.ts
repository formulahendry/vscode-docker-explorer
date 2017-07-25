import axios from "axios";
import * as vscode from "vscode";
import { DockerHubNode } from "../Model/DockerHubNode";
import { Entry } from "../Model/Entry";
import { Constants } from "./Constants";

export class DockerHubManager {

    private static _instance: DockerHubManager = new DockerHubManager();

    private _userName: string = "";
    private _password: string = "";
    private _token: string = "";

    constructor() {
        if (DockerHubManager._instance) {
            throw new Error("Error: Invalid new DockerHubUserManager");
        }
        DockerHubManager._instance = this;
    }

    public static get Instance(): DockerHubManager {
        return DockerHubManager._instance;
    }

    public get userName(): string {
        return this._userName;
    }

    public login(user: string, pwd: string): Promise<void> {
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

    public logout() {
        this._userName = "";
        this._password = "";
        this._token = "";
    }

    public listRepositories(): Promise<DockerHubNode[]> {
        return new Promise((resolve, reject) => {
            if (!this._token || this._token.length === 0) {
                return resolve([]);
            }
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
                    const repos = [];
                    for (const result of data.results) {
                        repos.push(result.name);
                    }
                    return resolve(repos.map((repo) => new DockerHubNode(
                        new Entry(repo, "r"),
                        this._userName,
                    )));
                } else {
                    return reject("Error: Cannot get repositories.");
                }
            })
            .catch((err) => {
                return reject(err.message);
            });
        });
    }

    public getTagsForRepo(repo: DockerHubNode): Promise<DockerHubNode[]> {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    "Authorization": `JWT ${this._token}`,
                    "Content-Type": "application/json",
                },
            };
            axios.post(`${Constants.REPOSITORY_URL}/${repo.path}/tags?${Constants.PAGE_SIZE}`, {}, options)
                .then((response) => {
                    const data: any = response.data;
                    if (data && data.count > 0 && data.results) {
                        const tags = [];
                        for (const result of data.results) {
                            tags.push(result.name);
                        }
                        return resolve(
                            tags.map((tag) => new DockerHubNode(
                                new Entry(tag, "i"),
                                repo.path,
                            )));
                    } else {
                        return reject("Error: Cannot get tags.");
                    }
                })
                .catch((err) => {
                    return reject(err.message);
                });
        });
    }
}
