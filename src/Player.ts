import { Socket } from "socket.io";
import { Action } from "./Types";
import { Game } from "./Game";

export class Player implements Action {
  private readonly _socket: Socket;
  private readonly _username: string;
  private _isAlive: boolean;
  private _isMafia: boolean;
  private _role: string;

  constructor(socket, username) {
    this._socket = socket;
    this._username = username;
    this._isAlive = true;
    this._isMafia = false;
    this._role = null;
  }

  getPlayerInfo() {
    return { username: this.username, isAlive: this.isAlive, isMafia: this.isMafia, role: this.role };
  }

  get username(): string {
    return this._username;
  }

  get isAlive(): boolean {
    return this._isAlive;
  }

  set isAlive(value: boolean) {
    this._isAlive = value;
  }

  get isMafia(): boolean {
    return this._isMafia;
  }

  set isMafia(value: boolean) {
    this._isMafia = value;
  }

  get role(): string {
    return this._role;
  }

  set role(value: string) {
    this._role = value;
  }

  get socket(): Socket {
    return this._socket;
  }

  doAction(game: Game, targetPlayer: Player) {

  }
}