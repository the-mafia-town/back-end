import { Player } from "./Player";
import { Game } from "./Game";

export class ActionManager {
  private _actions: Record<string, Action> = {};
  private readonly _game: Game;

  constructor(game: Game) {
    this._game = game;
  }

  get game(): Game {
    return this._game;
  }

  get actions(): Record<string, Action> {
    return this._actions;
  }

  clearActions() {
    this._actions = {};
  }

  setActions(actions) {
    for (const actor in actions) {
      this.actions[actor] = new Action(this.game.getPlayerFromUsername(actor), this.game.getPlayerFromUsername(actions[actor]), this.game.day);
    }
  }

  isRoleBlocked(actorPlayer: Player) {
  }

  isGodfatherDidAction(game: Game): Player {
    for (const actorUsername in this.actions) {
      let player = game.getPlayerFromUsername(actorUsername);
      if (player.role == "Godfather")
        return player;
    }
    return null;
  }

  isTargetProtected(targetPlayer: Player, game: Game): boolean {
    for (const actorUsername in this.actions) {
      let actorPlayer = game.getPlayerFromUsername(actorUsername);
      if (actorPlayer.role == "Doctor" && this.actions[actorUsername].targetPlayer.username == targetPlayer.username) {
        return true;
      }
    }
    return false;
  }

}

export class Action {
  private readonly _actorPlayer: Player;
  private readonly _targetPlayer: Player;
  private readonly _day: number;

  constructor(actorPlayer: Player, targetPlayer: Player, day: number) {
    this._actorPlayer = actorPlayer;
    this._targetPlayer = targetPlayer;
    this._day = day;
  }


  get actorPlayer(): Player {
    return this._actorPlayer;
  }

  get targetPlayer(): Player {
    return this._targetPlayer;
  }

  get day(): number {
    return this._day;
  }

}