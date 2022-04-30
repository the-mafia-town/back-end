import { Server } from "socket.io";
import { MessageType, PhaseTimes } from "./Types";

export class LoopManager {
  server: Server;
  votes = {};
  actions: Record<string, string> = {};
  voteTimer: number;
  nightTimer: number;

  constructor(server: Server) {
    this.server = server;
  }

  executeDiscussionPhase(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.countDownFrom(PhaseTimes.DISCUSSION_TIME, (time) => {
        console.log("Discussion timer:", time);
        this.server.emit(MessageType.DISCUSSION_TIME_INFO, time);
        if (time < 1) {
          resolve(1);
        }
      });
    });
  }

  onUserVoted(payload) {
    if (this.voteTimer > 0) {
      console.log(`User voted action captured. Username:${payload.username}, Target user: ${payload.targetUsername}`);
      let voteMessage = "";
      if (this.votes[payload.username] && this.votes[payload.username] == payload.targetUsername) {
        delete this.votes[payload.username];
        voteMessage = `${payload.username} changed his mind.`;
      } else {
        this.votes[payload.username] = payload.targetUsername;
        voteMessage = `${payload.username} voted for ${payload.targetUsername}.`;
      }
      this.server.emit(MessageType.USER_VOTED, { voteMessage: voteMessage });
    }
  }

  onUserActionTaken(payload: any) {
    if (this.nightTimer > 0) {
      console.log(`User action captured. Username:${payload.username}, Target user: ${payload.targetUsername}`);
      this.actions[payload.username] = payload.targetUsername;
    }
  }

  executeVotePhase(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.countDownFrom(PhaseTimes.VOTE_TIME, (time) => {
        console.log("Vote timer: ", time);
        // @ts-ignore
        this.server.emit(MessageType.VOTE_TIME_INFO, time);
        this.voteTimer = time;
        if (time < 1) {
          resolve(this.votes);
          this.votes = {};
        }
      });
    });
  }

  executeNightPhase(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.countDownFrom(PhaseTimes.NIGHT_TIME, (time) => {
        console.log("Night timer: ", time);
        // @ts-ignore
        this.server.emit(MessageType.NIGHT_TIME_INFO, time);
        this.nightTimer = time;
        if (time < 1) {
          resolve(this.actions);
          this.actions = {};
        }
      });
    });
  }

  countDownFrom(duration, callback) {
    let counter = duration;
    let intervalId = setInterval(() => {
      counter--;
      if (counter === 0) {
        clearInterval(intervalId);
      }
      callback(counter);
    }, 1000);
  }

}