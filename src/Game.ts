import {
  AttackDefenseType,
  investigationResultsForInvestigator,
  investigationResultsForSheriff,
  mafiaRoles,
  MessageType,
  numOfVotesRequiredForTrial,
  Phases,
  rolesPlayerNumberMapper
} from "./types.js";
import { LoopManager } from "./LoopManager";
import { Player } from "./Player";
import { Server } from "socket.io";
import { Action, ActionManager } from "./ActionManager.js";
import { Role } from "./Role";

export class Game {
  private readonly _server: Server;
  private readonly _gameCreator: string;
  private readonly _players: Player[];
  private _roleIndexPlayersMap = {};
  private _usernameIndexPlayersMap = {};
  private _socketIdIndexPlayersMap = {};
  private readonly _numberOfPlayer: number;
  private readonly _looper: LoopManager;
  private readonly _actionManager: ActionManager;
  private _day = 1;
  private deadPlayers: {} = {};
  private currentPhase: number;

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

  get socketIdIndexPlayersMap(): {} {
    return this._socketIdIndexPlayersMap;
  }

// I prefer to create these maps because we have to access specific player lots of time.
  // In this way, when we want to access a player, first we get the index of this player from this maps.
  // After that we can get player data from players array with O(1) time complexity.
  // If we access player with classic method searching on players array, time complexity would be O(n) at worst case.
  // This approach is working because we never change order of players in 'players' instance.
  indexPlayers() {
    this.players.forEach((value, index) => {
      this.roleIndexPlayersMap[value.role.name] = index;
      this.usernameIndexPlayersMap[value.username] = index;
      this.socketIdIndexPlayersMap[value.socket.id] = index;
    });
  }

  getPlayersInfo() {
    let playerInfos = [];
    for (const player of this.players) {
      playerInfos.push(player.getPlayerInfo());
    }
    return playerInfos;
  }

  getNumOfAlivePlayers() {
    return this.getNumOfAliveTownie() + this.getNumOfAliveMafia();
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
    for (const player of this.players) {
      if (player.isMafia && player.isAlive) {
        numOfAliveMafia++;
      }
    }
    return numOfAliveMafia;
  }

  async loop() {
    while (!this.isGameEnd()) {
      this.currentPhase = Phases.DISCUSSION_PHASE;
      await this.looper.executeDiscussionPhase();
      this.currentPhase = Phases.VOTING_PHASE;
      let votes = await this.looper.executeVotingPhase();
      let chosenPlayer = this.calculateVotes(votes);
      if (chosenPlayer.username != "none") {
        this.currentPhase = Phases.DEFENSE_PHASE;
        await this.looper.executeDefensePhase();
        this.currentPhase = Phases.JUDGEMENT_PHASE;
        votes = await this.looper.executeJudgementPhase();
        this.executeVotes(votes);
        this.currentPhase = Phases.LAST_WORDS_PHASE;
        await this.looper.executeLastWordsPhase();
      }
      this.currentPhase = Phases.NIGHT_PHASE;
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


  /*
    {
      "Safa":"Fatih",
      "Player3":"Player4",
      "Player5":"Fatih",
      "Player2":"Player5",
    }
   */
  executeActions(actions: Record<string, Action>) {
    let deathPlayers = [];
    let doneActions = [];
    for (const actorUsername in actions) {
      let action = actions[actorUsername];
      let actorPlayer = action.actorPlayer;
      let targetPlayer = action.targetPlayer;
      if (actorPlayer.role.name == "Godfather") {
        if (this.isTargetProtected(targetPlayer, actions)) {
          console.log("Target is protected this night.");
        } else {
          deathPlayers.push(targetPlayer);
        }
        doneActions.push(actorPlayer.username);
      } else if (actorPlayer.role.name == "Mafioso") {
        if (!this.isGodfatherAlive() && !this.isGodfatherDidAction(actions)) {
          deathPlayers.push(targetPlayer);
          doneActions.push(actorPlayer.username);
        }
      } else if (actorPlayer.role.name == "Consigliere") {

      } else if (actorPlayer.role.name == "Jailor") {
        let idxOfActor = this.usernameIndexPlayersMap[actorPlayer.username];
        let idxOfTarget = this.usernameIndexPlayersMap[targetPlayer.username];
        this.players[idxOfActor].role.attack = AttackDefenseType.UNSTOPPABLE_ATTACK;
        this.players[idxOfTarget].role.defense = AttackDefenseType.POWERFUL_DEFENSE;
      } else if (actorPlayer.role.name == "Doctor") {
        let idxOfTarget = this.usernameIndexPlayersMap[targetPlayer.username];
        this.players[idxOfTarget].role.defense = AttackDefenseType.POWERFUL_DEFENSE;
      } else if (actorPlayer.role.name == "Investigator") {
        let targetInfo = investigationResultsForInvestigator[targetPlayer.role.name];
        this.server.to(actorPlayer.socket.id).emit(MessageType.ACTION_RESULT_TAKEN, targetInfo);
      } else if (actorPlayer.role.name == "Sheriff") {
        let targetInfo = investigationResultsForSheriff[targetPlayer.role.name];
        this.server.to(actorPlayer.socket.id).emit(MessageType.ACTION_RESULT_TAKEN, targetInfo);
      } else if (actorPlayer.role.name == "Veteran") {
        let idxOfTarget = this.usernameIndexPlayersMap[actorPlayer.username];
        this.players[idxOfTarget].role.defense = AttackDefenseType.BASIC_DEFENSE;
        this.players[idxOfTarget].role.attack = AttackDefenseType.POWERFUL_ATTACK;
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
    for (const actor in actions) {
      let action = actions[actor];
      if (action.targetPlayer.username == actorPlayer.username) {
        let player = this.usernameIndexPlayersMap[action.actorPlayer.username];
        if (player.role === "Doctor" || player.role === "Jailor") {
          return true;
        }
      }
    }
    return false;
  }

  isGodfatherDidAction(actions): Player {
    for (const actorUsername in actions) {
      let player = this.getPlayerFromUsername(actorUsername);
      if (player.role.name == "Godfather")
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
      if (actorPlayer.role.name == "Doctor" && actions[actorUsername] == targetPlayer.username) {
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
      let idxOfPlayer = this.usernameIndexPlayersMap[chosenPlayer.username];
      this.players[idxOfPlayer].isAlive = false;
      this.changeRoleOfMafiosoIfGFDied();
      this.changeRoleOfConsigliereIfGFAndMFDied();
      chosenPlayer.role = this.players[idxOfPlayer].role.name;
      this.server.emit(MessageType.VOTE_INFO, chosenPlayer);
      this.server.emit(MessageType.GAME_INFO, this.getPlayersInfo());
      this.addToDeathPlayers(this.players[idxOfPlayer]);
    }
  }

  changeRoleOfConsigliereIfGFAndMFDied() {
    let idxOfGF = this.roleIndexPlayersMap["Godfather"];
    let idxOfMF = this.roleIndexPlayersMap["Mafioso"];
    let idxOfCons = this.roleIndexPlayersMap["Consigliere"];
    if (this.players[idxOfGF].isAlive == false && this.players[idxOfMF].isAlive == false) {
      this.players[idxOfCons].role = new Role("Mafioso");
    }
  }

  changeRoleOfMafiosoIfGFDied() {
    let idxOfGF = this.roleIndexPlayersMap["Godfather"];
    let idxOfMF = this.roleIndexPlayersMap["Mafioso"];
    if (this.players[idxOfGF].isAlive == false) {
      this.players[idxOfMF].role = new Role("Godfather");
    }
  }

  calculateVotes(votes) {
    console.log("Votes: ", votes);
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
    console.log("Votes sorted", sorted);
    console.log("Current phase: ", this.currentPhase);
    if (this.currentPhase == Phases.VOTING_PHASE) {
      if (sorted.length == 1 || (sorted.length > 1 && sorted[0][1] !== sorted[1][1])) {
        chosenPlayer.username = sorted[0][0];
        // @ts-ignore
        chosenPlayer.vote = sorted[0][1];
      }
    } else if (this.currentPhase == Phases.JUDGEMENT_PHASE) {
      let requiredVotes = numOfVotesRequiredForTrial[this.getNumOfAlivePlayers()];
      if (sorted.length > 0 && sorted[0][1] >= requiredVotes) {
        chosenPlayer.username = sorted[0][0];
        // @ts-ignore
        chosenPlayer.vote = sorted[0][1];
      }
    }
    console.log("Chosen player:", chosenPlayer);
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

  static createGame(io, gameCreator, connectedPlayers) {
    let players = [];
    connectedPlayers.map(player => {
      players.push(new Player(player.socket, player.username));
    });
    return new Game(io, gameCreator, players);
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

