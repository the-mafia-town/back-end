import { ImmunityRoleMap, roleImmunities } from "./Types";

export class Role {
  private readonly _name: string;
  private _defense: number;
  private _attack: number;
  private _immunities: number[];

  constructor(name: string) {
    this._name = name;
    this._attack = ImmunityRoleMap[name][0];
    this._defense = ImmunityRoleMap[name][1];
    this.immunities = roleImmunities[name];
  }

  get immunities(): number[] {
    return this._immunities;
  }

  set immunities(value: number[]) {
    this._immunities = value;
  }

  get name(): string {
    return this._name;
  }

  get defense(): number {
    return this._defense;
  }

  set defense(value: number) {
    this._defense = value;
  }

  get attack(): number {
    return this._attack;
  }

  set attack(value: number) {
    this._attack = value;
  }

}