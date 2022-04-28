import { mafiaRoles, MessageType, rolesPlayerNumberMapper } from "./types.js";
import { LoopManager } from "./LoopManager";
import { Player } from "./Player";
import { Server } from "socket.io";
import { Actions } from "./Actions.js";

export class Game {
  private readonly _server: Server;
  private readonly _gameCreator: string;
  private readonly _players: Player[];
  private readonly _numberOfPlayer: number;
  private readonly _matchedRoles: any[];
  private readonly _looper: LoopManager;
  private day = 1;
  private deadPlayers: {} = {};

  constructor(io, gameCreator, players) {
    console.log("Game constructor is called");
    this._server = io;
    this._gameCreator = gameCreator;
    this._players = players;
    this._numberOfPlayer = players.length;
    this._matchedRoles = this.matchRoles();
    this._looper = new LoopManager(io);
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
    //while (!isGameEnd()) {
    await this.looper.executeDiscussionPhase();
    let votes = await this.looper.executeVotePhase();
    this.executeVotes(votes);
    let actions = await this.looper.executeNightPhase();
    this.executeActions(actions);
    this.day++;
    //}
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
    this.deadPlayers[this.day] = player;
  }

  executeActions(actions: Actions) {
    let deathPlayers = [];
    let doneActions = [];
    for (const actorUsername in actions) {
      let targetUsername = actions[actorUsername];
      let actorPlayer = this.getPlayerFromUsername(actorUsername);
      let targetPlayer = this.getPlayerFromUsername(targetUsername);
      if (actorPlayer.role == "Godfather") {
        if (this.isTargetProtected(targetPlayer, actions)) {
          console.log("Target is protected this night.");
        } else {
          deathPlayers.push(targetPlayer);
        }
        doneActions.push(actorPlayer.username);
      } else if (actorPlayer.role == "Mafioso") {
        if (this.isGodfatherAlive() && this.isGodfatherDidAction(actions)) {

        }
      } else if (actorPlayer.role == "Framer") {

      } else if (actorPlayer.role == "Jailor") {

      } else if (actorPlayer.role == "Doctor") {

      } else if (actorPlayer.role == "Investigator") {

      } else if (actorPlayer.role == "Sheriff") {

      }
    }
  }

  isRoleBlocked(actorPlayer: Player, actions){

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
    for (const player of this.players) {
      if (player.role == "Godfather" && player.isAlive)
        return true;
    }
    return false;
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
    for (const player of this.players) {
      if (player.username == searchingUsername && player.isAlive)
        return player;
    }
    return null;
  }

  executeVotes(votes) {
    let chosenPlayer = this.calculateVotes(votes);
    if (chosenPlayer.username != "none") {
      for (const idx in this.players) {
        if (this.players[idx].username == chosenPlayer.username) {
          this.players[idx].isAlive = false;
          chosenPlayer.role = this.players[idx].role;
          this.server.emit(MessageType.VOTE_INFO, chosenPlayer);
          this.server.emit(MessageType.GAME_INFO, this.getPlayersInfo());
          this.addToDeathPlayers(this.players[idx]);
          break;
        }
      }
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
    let chosenPlayer = { username: "none", role: "", vote: 0 };
    for (const player in playerVotes) {
      if (playerVotes[player] > chosenPlayer.vote) {
        chosenPlayer = { username: player, role: "", vote: playerVotes[player] };
      }
    }
    return chosenPlayer;
  }

  matchRoles() {
    console.log("Num of players:", this._numberOfPlayer);
    let roles = rolesPlayerNumberMapper[this._numberOfPlayer];
    console.log("Roles:", roles);
    let shuffledRoles = this.shuffleArray(roles);
    let matchedRoles = [];
    for (let i = 0; i < this._players.length; i++) {
      let matchedRole = shuffledRoles[i];
      this._players[i].role = matchedRole;
      if (mafiaRoles.includes(matchedRole)) {
        this._players[i].isMafia = true;
      }
      matchedRoles.push({ "username": this._players[i].username, "role": shuffledRoles[i] });
    }
    return matchedRoles;
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

  get matchedRoles(): any[] {
    return this._matchedRoles;
  }

  get looper(): LoopManager {
    return this._looper;
  }
}

interface Action {
  actorPlayer: Player,
  targetPlayer: Player,

}
