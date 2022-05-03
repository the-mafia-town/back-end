import { Server } from "socket.io";
import { MessageType, Phases, PhaseTimes } from "./Types";

export class LoopManager {
  server: Server;
  votes = {};
  actions: Record<string, string> = {};
  timer: number;
  currentPhase: number;

  constructor(server: Server) {
    this.server = server;
  }

  executeDiscussionPhase(): Promise<any> {
    this.currentPhase = Phases.DISCUSSION_PHASE;
    return new Promise((resolve) => {
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
    if (this.timer > 0) {
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
    if (this.timer > 0) {
      console.log(`User action captured. Username:${payload.username}, Target user: ${payload.targetUsername}`);
      if (this.actions[payload.username] && this.actions[payload.username] == payload.targetUsername) {
        delete this.actions[payload.username];
      } else {
        this.actions[payload.username] = payload.targetUsername;
      }
    }
  }

  executeVotingPhase(): Promise<any> {
    this.currentPhase = Phases.VOTING_PHASE;
    return new Promise((resolve) => {
      this.countDownFrom(PhaseTimes.VOTING_TIME, (time) => {
        console.log("Vote timer: ", time);
        // @ts-ignore
        this.server.emit(MessageType.VOTING_TIME_INFO, time);
        this.timer = time;
        if (time < 1) {
          resolve(this.votes);
          this.votes = {};
        }
      });
    });
  }

  executeDefensePhase(): Promise<any> {
    this.currentPhase = Phases.DEFENSE_PHASE;
    return new Promise((resolve) => {
      this.countDownFrom(PhaseTimes.DEFENSE_TIME, (time) => {
        console.log("Discussion timer:", time);
        this.server.emit(MessageType.DEFENSE_TIME_INFO, time);
        if (time < 1) {
          resolve(1);
        }
      });
    });
  }

  executeJudgementPhase(): Promise<any> {
    this.currentPhase = Phases.JUDGEMENT_PHASE;
    return new Promise((resolve) => {
      this.countDownFrom(PhaseTimes.JUDGEMENT_TIME, (time) => {
        console.log("Discussion timer:", time);
        this.timer = time;
        this.server.emit(MessageType.JUDGEMENT_TIME_INFO, time);
        if (time < 1) {
          resolve(this.votes);
          this.votes = {};
        }
      });
    });
  }

  executeLastWordsPhase(): Promise<any> {
    this.currentPhase = Phases.LAST_WORDS_PHASE;
    return new Promise((resolve) => {
      this.countDownFrom(PhaseTimes.LAST_WORDS_TIME, (time) => {
        console.log("Discussion timer:", time);
        this.server.emit(MessageType.LAST_WORDS_TIME_INFO, time);
        if (time < 1) {
          resolve(1);
        }
      });
    });
  }

  executeNightPhase(): Promise<any> {
    this.currentPhase = Phases.NIGHT_PHASE;
    return new Promise((resolve) => {
      this.countDownFrom(PhaseTimes.NIGHT_TIME, (time) => {
        console.log("Night timer: ", time);
        // @ts-ignore
        this.server.emit(MessageType.NIGHT_TIME_INFO, time);
        this.timer = time;
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