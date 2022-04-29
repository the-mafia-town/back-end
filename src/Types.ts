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
  ACTION_RESULT_TAKEN: "18",

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
  "8": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Godfather", "Mafioso"],
  "9": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Godfather", "Mafioso", "Consigliere"],
  "10": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Bodyguard", "Godfather", "Mafioso", "Consigliere"],
  "11": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Bodyguard", "Veteran", "Godfather", "Mafioso", "Consigliere"],
  "12": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Bodyguard", "Veteran", "Vigilante", "Godfather", "Mafioso", "Consigliere"],
  "13": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Bodyguard", "Veteran", "Vigilante", "Mayor", "Godfather", "Mafioso", "Consigliere"],
  "14": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Bodyguard", "Veteran", "Vigilante", "Mayor", "Spy", "Godfather", "Mafioso", "Consigliere"],
  "15": ["Sheriff", "Doctor", "Investigator", "Lookout", "Jailor", "Escort", "Bodyguard", "Veteran", "Vigilante", "Mayor", "Spy", "Transporter", "Godfather", "Mafioso", "Consigliere"]
};

export let investigationResultsForInvestigator = {
  "Jailor": "Your target could be a Spy, Blackmailer, or Jailor.",
  "Investigator": "Your target could be an Investigator, Consigliere, or Mayor.",
  "Lookout": "Your target could be a Lookout, Forger, or Witch.",
  "Sheriff": "Your target could be a Sheriff, Executioner, or Werewolf.",
  "Spy": "Your target could be a Spy, Blackmailer, or Jailor.",
  "Veteran": "Your target could be a Vigilante, Veteran, Mafioso, or Ambusher.",
  "Vigilante": "Your target could be a Vigilante, Veteran, Mafioso, or Ambusher.",
  "Bodyguard": "Your target could be a Bodyguard, Godfather, or Arsonist.",
  "Doctor": "Your target could be a Doctor, Disguiser, or Serial Killer.",
  "Escort": "Your target could be an Escort, Transporter, Consort, or Hypnotist.",
  "Mayor": "Your target could be an Investigator, Consigliere, or Mayor.",
  "Transporter": "Your target could be an Escort, Transporter, Consort, or Hypnotist.",
  "Godfather": "Your target could be a Bodyguard, Godfather, or Arsonist.",
  "Mafioso": "Your target could be a Vigilante, Veteran, Mafioso, or Ambusher.",
  "Consigliere": "Your target could be an Investigator, Consigliere, or Mayor."
};

export let investigationResultsForSheriff = {
  "Jailor": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Investigator": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Lookout": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Sheriff": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Spy": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Veteran": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Vigilante": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Bodyguard": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Doctor": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Escort": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Mayor": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Transporter": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Godfather": "You cannot find evidence of wrongdoing. Your target seems innocent.",
  "Mafioso": "Your target is suspicious!",
  "Consigliere": "Your target is suspicious!"
};
export let mafiaRoles = ["Godfather", "Mafioso", "Framer"];

export interface Action {
  doAction(game: Game, targetPlayer: Player);
}
