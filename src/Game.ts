import {
  investigationResultsForInvestigator,
  investigationResultsForSheriff,
  mafiaRoles,
  MessageType,
  rolesPlayerNumberMapper
} from "./types.js";
import { LoopManager } from "./LoopManager";
import { Player } from "./Player";
import { Server } from "socket.io";
import { Action, ActionManager } from "./ActionManager.js";

export class Game {
  private readonly _server: Server;
  private readonly _gameCreator: string;
  private readonly _players: Player[];
  private _roleIndexPlayersMap = {};
  private _usernameIndexPlayersMap = {};
  private readonly _numberOfPlayer: number;
  private readonly _looper: LoopManager;
  private readonly _actionManager: ActionManager;
  private _day = 1;
  private deadPlayers: {} = {};

  constructor(io, gameCreator, players) {
    console.log("Game constructor is called");
    this._server = io;
    this._gameCreator = gameCreator;
    this._players = players;
    this._numberOfPlayer = players.length;
    this._looper = new LoopManager(io);
    this._actionManager = new ActionManager(this);
    this.deadPlayers[this.day] = [];
    this.matchRoles();
    this.indexPlayers();
  }

  get roleIndexPlayersMap(): {} {
    return this._roleIndexPlayersMap;
  }

  get usernameIndexPlayersMap(): {} {
    return this._usernameIndexPlayersMap;
  }

  indexPlayers() {
    this.players.forEach((value, index) => {
      this.roleIndexPlayersMap[value.role] = index;
      this.usernameIndexPlayersMap[value.username] = index;
    });
  }

  getPlayersInfo() {
    let playerInfos = [];
    for (const player of this.players) {
      playerInfos.push(player.getPlayerInfo());
    }
    return playerInfos;
  }

  getNumOfAliveTownie() {
    let numOfAliveTownie = 0;
    for (const player of this.players) {
      if (!player.isMafia && player.isAlive) {
        numOfAliveTownie++;
      }
    }
    return numOfAliveTownie;
  }

  getNumOfAliveMafia() {
    let numOfAliveMafia = 0;
    for (const player of this._players) {
      if (player.isMafia && player.isAlive) {
        numOfAliveMafia++;
      }
    }
    return numOfAliveMafia;
  }

  async loop() {
    while (!this.isGameEnd()) {
      await this.looper.executeDiscussionPhase();
      let votes = await this.looper.executeVotePhase();
      this.executeVotes(votes);
      let actions = await this.looper.executeNightPhase();
      this.actionManager.setActions(actions);
      this.executeActions(this.actionManager.actions);
      this.forwardDay();
    }
  }

  forwardDay() {
    console.log(`${this.day}.day is over. \nDeath players: ${this.deadPlayers[this.day].map(player => player.username)}`);
    this.server.emit(MessageType.GAME_INFO, this.getPlayersInfo());
    this._day++;
    this.deadPlayers[this.day] = [];
    this.actionManager.clearActions();
  }

  isGameEnd() {
    return this.getNumOfAliveMafia() == 0 || this.getNumOfAliveTownie() == 0;
  }

  getWinnerTeam() {
    if (this.getNumOfAliveMafia() == 0)
      return "Town";
    else if (this.getNumOfAliveTownie() == 0) {
      return "Mafia";
    }
  }

  addToDeathPlayers(player: Player) {
    if (this.deadPlayers[this.day] == undefined) {
      this.deadPlayers[this.day] = [];
    }
    this.deadPlayers[this.day].push(player);
  }

  executeActions(actions: Record<string, Action>) {
    let deathPlayers = [];
    let doneActions = [];
    for (const actorUsername in actions) {
      let action = actions[actorUsername];
      let actorPlayer = action.actorPlayer;
      let targetPlayer = action.targetPlayer;
      if (actorPlayer.role == "Godfather") {
        if (this.isTargetProtected(targetPlayer, actions)) {
          console.log("Target is protected this night.");
        } else {
          deathPlayers.push(targetPlayer);
        }
        doneActions.push(actorPlayer.username);
      } else if (actorPlayer.role == "Mafioso") {
        if (!this.isGodfatherAlive() && !this.isGodfatherDidAction(actions)) {
          deathPlayers.push(targetPlayer);
          doneActions.push(actorPlayer.username);
        }
      } else if (actorPlayer.role == "Consigliere") {

      } else if (actorPlayer.role == "Jailor") {

      } else if (actorPlayer.role == "Doctor") {

      } else if (actorPlayer.role == "Investigator") {
        let targetInfo = investigationResultsForInvestigator[targetPlayer.role];
        this.server.to(actorPlayer.socket.id).emit(MessageType.ACTION_RESULT_TAKEN, targetInfo);
      } else if (actorPlayer.role == "Sheriff") {
        let targetInfo = investigationResultsForSheriff[targetPlayer.role];
        this.server.to(actorPlayer.socket.id).emit(MessageType.ACTION_RESULT_TAKEN, targetInfo);
      }
    }
    this.killPlayers(deathPlayers);
  }

  killPlayers(deathPlayers: Player[]) {
    for (const deadPlayer of deathPlayers) {
      this.killPlayer(deadPlayer.username);
    }
  }

  killPlayer(username: string) {
    let idxOfPlayer = this.usernameIndexPlayersMap[username];
    this.players[idxOfPlayer].isAlive = false;
    this.addToDeathPlayers(this.players[idxOfPlayer]);
  }

  isRoleBlocked(actorPlayer: Player, actions) {

  }

  isGodfatherDidAction(actions): Player {
    for (const actorUsername in actions) {
      let player = this.getPlayerFromUsername(actorUsername);
      if (player.role == "Godfather")
        return player;
    }
    return null;
  }

  isGodfatherAlive(): boolean {
    return this.roleIndexPlayersMap["Godfather"].isAlive;
  }

  isTargetProtected(targetPlayer: Player, actions): boolean {
    for (const actorUsername in actions) {
      let actorPlayer = this.getPlayerFromUsername(actorUsername);
      if (actorPlayer.role == "Doctor" && actions[actorUsername] == targetPlayer.username) {
        return true;
      }
    }
    return false;
  }

  getPlayerFromUsername(searchingUsername): Player {
    let playerIdx = this.usernameIndexPlayersMap[searchingUsername];
    let player = this.players[playerIdx];
    if (player.isAlive)
      return player;
    return null;
  }

  executeVotes(votes) {
    let chosenPlayer = this.calculateVotes(votes);
    if (chosenPlayer.username != "none") {
      for (const idx in this.players) {
        if (this.players[idx].username == chosenPlayer.username) {
          this.players[idx].isAlive = false;
          this.changeRoleOfMafiosoIfGFDied();
          this.changeRoleOfConsigliereIfGFAndMFDied();
          chosenPlayer.role = this.players[idx].role;
          this.server.emit(MessageType.VOTE_INFO, chosenPlayer);
          this.server.emit(MessageType.GAME_INFO, this.getPlayersInfo());
          this.addToDeathPlayers(this.players[idx]);
          break;
        }
      }
    }
  }

  changeRoleOfConsigliereIfGFAndMFDied() {
    let idxOfGF = this.roleIndexPlayersMap["Godfather"];
    let idxOfMF = this.roleIndexPlayersMap["Mafioso"];
    let idxOfCons = this.roleIndexPlayersMap["Consigliere"];
    if (this.players[idxOfGF].isAlive == false && this.players[idxOfMF].isAlive == false) {
      this.players[idxOfCons].role = "Mafioso";
    }
  }

  changeRoleOfMafiosoIfGFDied() {
    let idxOfGF = this.roleIndexPlayersMap["Godfather"];
    let idxOfMF = this.roleIndexPlayersMap["Mafioso"];
    if (this.players[idxOfGF].isAlive == false) {
      this.players[idxOfMF].role = "Godfather";
    }
  }

  calculateVotes(votes) {
    console.log(votes);
    let playerVotes = {};
    for (const voter in votes) {
      let target = votes[voter];
      if (playerVotes[target]) {
        playerVotes[target]++;
      } else {
        playerVotes[target] = 1;
      }
    }
    let entries = Object.entries(playerVotes);
    let sorted = entries.sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
    let chosenPlayer = { username: "none", role: "", vote: 0 };
    if (sorted[0] !== sorted[1]) {
      chosenPlayer.username = sorted[0][0];
      // @ts-ignore
      chosenPlayer.vote = sorted[0][1];
    }
    return chosenPlayer;
  }

  matchRoles() {
    let roles = rolesPlayerNumberMapper[this.numberOfPlayer];
    let shuffledRoles = this.shuffleArray(roles);
    for (let i = 0; i < this.players.length; i++) {
      let matchedRole = shuffledRoles[i];
      this.players[i].role = matchedRole;
      if (mafiaRoles.includes(matchedRole)) {
        this.players[i].isMafia = true;
      }
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }


  get server(): any {
    return this._server;
  }

  get gameCreator(): any {
    return this._gameCreator;
  }

  get players(): Player[] {
    return this._players;
  }

  get numberOfPlayer(): any {
    return this._numberOfPlayer;
  }

  get looper(): LoopManager {
    return this._looper;
  }

  get actionManager(): ActionManager {
    return this._actionManager;
  }

  get day(): number {
    return this._day;
  }
}

