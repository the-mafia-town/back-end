import { Game } from "./Game";
import { Player } from "./Player";

export let MessageType = {
  // A message type you send to server, when want to join.
  JOIN: "1",
  // A message type you send to server, when want to disconnect from server.
  DISCONNECT: "2",

  CREATE_GAME: "3",

  // You receive room info as a response for join command. It contains information about
  // the room you joined, and it's users
  GAME: "4",

  START_GAME: "5",
  GAME_INFO: "6",

  // A message type you receive from server when another user want to join.
  USER_JOINED: "7",
  // A message type you receive from server when another user is ready to play.
  USER_READY: "8",
  // A message type you receive from server when another user want to disconnect.
  USER_DISCONNECT: "9",
  USER_SENT_MESSAGE: "10",
  USER_MESSAGE_RECEIVED: "11",
  DISCUSSION_TIME_INFO: "12",
  VOTE_TIME_INFO: "13",
  NIGHT_TIME_INFO: "14",
  USER_ACTION_TAKEN: "15",
  VOTE_INFO: "16",
  USER_VOTED: "17",

  // Errors... shit happens
  ERROR_ROOM_IS_FULL: "998",
  ERROR_USER_INITIALIZED: "998",
  ERROR_GAME_ALREADY_EXIST: "999"
};

export let Phases = {
  DISCUSSION_PHASE: 1,
  VOTE_PHASE: 2,
  NIGHT_PHASE: 3
};

export let PhaseTimes = {
  DISCUSSION_TIME: 6,
  VOTE_TIME: 6,
  NIGHT_TIME: 6
};

export let rolesPlayerNumberMapper = {
  "1": ["Sheriff", "Doctor", "Investigator", "Jailor", "Godfather"],
  "5": ["Sheriff", "Doctor", "Investigator", "Jailor", "Godfather"],
  "6": ["Sheriff", "Doctor", "Investigator", "Jailor", "Godfather", "Mafioso"],
  "7": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Godfather", "Mafioso"],
  "8": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Godfather", "Mafioso"],
  "9": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Godfather", "Mafioso", "Framer"],
  "10": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Godfather", "Mafioso", "Framer"],
  "11": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Medium", "Godfather", "Mafioso", "Framer"],
  "12": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Vigilante", "Godfather", "Mafioso", "Framer"],
  "13": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Bodyguard", "Godfather", "Mafioso", "Framer"],
  "14": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Investigator", "Godfather", "Mafioso", "Framer"],
  "15": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Investigator", "Mayor", "Godfather", "Mafioso", "Framer"]
};

export let mafiaRoles = ["Godfather", "Mafioso", "Framer"];

export interface Action {
  doAction(game: Game, targetPlayer: Player);
}
