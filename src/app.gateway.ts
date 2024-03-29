import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { MessageType } from "./Types";
import { Game } from "./Game";

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  private server: Server;

  private game: Game;
  private gameCreator: string;
  private connectedPlayers: ConnectedPlayer[];

  private logger: Logger = new Logger("AppGateway");

  @SubscribeMessage(MessageType.START_GAME)
  onStartGame(client: Socket, payload: any): void {
    this.game = Game.createGame(this.server, this.gameCreator, this.connectedPlayers);
    this.game.loop();
    let info = this.game.getPlayersInfo();
    this.server.emit(MessageType.GAME_STARTED, info);
    this.server.emit(MessageType.GAME_INFO, info);
  }

  @SubscribeMessage(MessageType.CREATE_GAME)
  onCreateGame(client: Socket, payload: any): void {
    this.logger.log(`Create game event taken. Creator is ${payload.username}`);
    this.connectedPlayers = [];
    this.connectedPlayers = [
      {
        socket: client,
        username: "SAFA"
      },
      {
        socket: client,
        username: "Fatih"
      },
      {
        socket: client,
        username: "Player3"
      },
      {
        socket: client,
        username: "Player4"
      },
      {
        socket: client,
        username: "Player5"
      }
    ];
    this.gameCreator = payload.username;
    this.connectedPlayers.push({ "socket": client, "username": payload.username });
  }

  @SubscribeMessage(MessageType.JOIN)
  onUserJoin(client: Socket, payload: any): void {
    this.logger.log(`JOIN event taken. ${payload.username} wants to join.`);
    if (this.connectedPlayers.length > 14) {
      let message = "Maximum number of player is reached.";
      this.logger.log(message);
      this.server.to(client.id).emit(message);
      return;
    }
    this.connectedPlayers.push({ "socket": client, "username": payload.username });
    this.server.emit(MessageType.USER_JOINED, {
      lastJoinedUser: payload.username,
      users: this.connectedPlayers.map(player => player.username)
    });
  }

  @SubscribeMessage(MessageType.JAILOR_SENT_MESSAGE)
  onJailorSentMessage(client: Socket, payload: any): void {
    let senderUsername = payload.sender;
    let targetUsername = payload.targetUsername;
    let targetIdx = this.game.usernameIndexPlayersMap[targetUsername];
    let targetPlayer = this.game.players[targetIdx];
    this.server.to(targetPlayer.socket.id).emit(MessageType.JAILOR_SENT_MESSAGE, {
      jailorUsername: senderUsername,
      message: payload.message
    });
  }

  @SubscribeMessage(MessageType.USER_SENT_MESSAGE)
  onUserSentMessage(client: Socket, payload: any): void {
    console.log("Client id:", client.id);
    console.log(`Message '${payload["message"]}' is sent by ${payload["sender"]}`);
    this.server.emit(MessageType.USER_MESSAGE_RECEIVED + "", payload);
  }

  @SubscribeMessage(MessageType.USER_VOTED)
  onUserVoted(client: Socket, payload: any): void {
    this.game.looper.onUserVoted(payload);
  }

  @SubscribeMessage(MessageType.USER_ACTION_TAKEN)
  onUserAction(client: Socket, payload: any): void {
    this.game.looper.onUserActionTaken(payload);
  }

  afterInit(server: Server) {
    this.logger.log("Init");
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}

interface ConnectedPlayer {
  username: string,
  socket: Socket
}
