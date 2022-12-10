import Constants from "./Constants";
import Regex from "./Regex";

export default class MachineParser {
  private line = 0;

  public get linePlus() {
    // in text editors lines start with #1 (not 0)
    return this.line + 1;
  }

  public nextLine() {
    this.line += 1;
  }

  public previousLine() {
    this.line -= 1;
  }

  // stateID, current source line#, definition line#, isSubroutine(0/1)

  private states = new Map<string, [number, number, number]>();

  private groups = new Map<string, string[]>();

  private messages = new Map<string, [string, string]>();

  private currentGroup = Constants.initialGroupName;

  private lines = [""];

  private out = "";

  private dotCommands = "";

  private firstState = "";

  public parse(src: string) : string {
    this.lines = src.split("\n");

    this.reset();

    this.findDot();
    this.nextLine();
    this.processDot();

    this.nextLine();
    this.findStateBeginning();
    this.nextLine();
    this.processStates();

    this.nextLine();
    this.findStateImplementations();
    this.processStateGroups();

    this.processMessages();
    this.endDot();
    return this.out;
  }

  public reset() {
    this.firstState = "";

    this.out = "";
    this.line = 0;
    this.dotCommands = "";

    this.states.clear();
    this.groups.clear();
    this.messages.clear();

    this.currentGroup = Constants.initialGroupName;
    this.groups.set(this.currentGroup, []);
  }

  public findDot() {
    for (; this.line < this.lines.length; this.line += 1) {
      if (this.lines[this.line].includes(Constants.dotMarkerBegin)) {
        break;
      }
    }
  }

  public processDot() {
    for (; this.line < this.lines.length; this.line += 1) {
      // Finalizar Dot
      if (this.lines[this.line].includes(Constants.dotMarkerEnd)) {
        break;
      }
      // Quitar todos los / (comentarios)
      const command = this.lines[this.line].replace(Regex.slash, "");
      this.dotCommands += `${command}\n`;
    }

    console.log(`Dot Commands: \n${this.dotCommands}`);

    this.out += `${Constants.dotBegin}\n${this.dotCommands}\n`;
  }

  public endDot() {
    this.out += "\n";
    this.out += Constants.dotEnd;
  }

  public findStateBeginning() {
    for (; this.line < this.lines.length; this.line += 1) {
      if (this.lines[this.line].includes(Constants.stateMarkerBegin)) {
        break;
      }
    }
  }

  public processStates() {
    let didSaveFirstState = false;

    let isSubroutine = 0;
    let isGroup = false;

    for (; this.line < this.lines.length; this.line += 1) {
      // Finalizar estados
      if (this.lines[this.line].includes(Constants.stateMarkerEnd)) {
        break;
      }

      if (this.lines[this.line].includes(Constants.subroutine)) {
        isSubroutine = 1;
        console.log(`contains #Subroutine at line ${this.linePlus}`);
      }

      if (this.lines[this.line].includes(Constants.stateGroupBegin)) {
        isGroup = true;
        isSubroutine = 1;
        console.log("contains #Group");
      }

      if (this.lines[this.line].includes(Constants.stateGroupEnd)) {
        isGroup = false;
        this.currentGroup = Constants.initialGroupName;
        console.log("#EndGroup");
      }

      // is between brackets?
      const matches = this.lines[this.line].match(Regex.betweenBracketsDot);

      if (matches) {
        const state = matches[1];

        if (isGroup) {
          this.currentGroup = state;
          this.groups.set(this.currentGroup, []);
          isGroup = false;
        }

        // Agregar a la coleccion de estados
        this.groups.get(this.currentGroup)?.push(state);

        this.states.set(state, [this.linePlus, 0, isSubroutine]);
        console.log(`#Subroutine ${isSubroutine} ${state}`);
        isSubroutine = 0;

        if (!didSaveFirstState) {
          this.firstState = state;
          didSaveFirstState = true;
        }

        // Process messages here:
        // this.nextLine();
        this.processMessagesForState(state);
        this.previousLine();
      } // if (matches) between brackets
    } // for

    console.log(`Groups ${this.groups.get(this.currentGroup)?.toString()}`);
    // console.log([this.messages.entries()]);
  }

  public processMessagesForState(currentState: String) {
    // Armar mapa mensajes

    // Guardar mensajes en el mapa
    for (; this.line < this.lines.length; this.line += 1) {
      // Finalizar al encontrar un estado nuevo o fin de estados
      if (this.lines[this.line].includes(Constants.stateMarkerEnd)) { break; }
      // is between brackets?
      // const matchesBetweenBracketsDot = this.lines[this.line].match(Regex.betweenBracketsDot);

      // if (matchesBetweenBracketsDot) { break; }
      const matchesEndingBracket = this.lines[this.line].match(Regex.endingBracket);
      if (matchesEndingBracket) { break; }

      const matchesMessageColonState = this.lines[this.line].match(Regex.messageColonState);

      // eslint-disable-next-line
      if (!matchesMessageColonState) { continue; }

      const tokens = this.lines[this.line].match(Regex.identifier) ?? [];

      // eslint-disable-next-line
      if (tokens.length !== 2) { continue; }

      const currentMessage = tokens[0];
      const nextState = tokens[1];

      // Si ya existe la relacion contraria de estados en el mapa
      // asignarla como segundo mensaje
      const invRel = `${nextState}:${currentState}`;
      if (this.messages.has(invRel)) {
        const msg = this.messages.get(invRel) ?? ["", ""];
        msg[1] = `${this.linePlus}. ${currentMessage}`;

        this.messages.delete(invRel);

        this.messages.set(
          invRel,
          [msg[0], msg[1]],
        );
        // eslint-disable-next-line
        continue;
      } else {
        this.messages.set(
          `${currentState}:${nextState}`, // currentState:nextState
          [`${this.linePlus}. ${currentMessage}`, ""], // #line. message
        );
      }
    }
  }

  public processMessages() {
    this.out += "\n";

    this.messages.forEach((value, key) => {
      const states = key.split(":");
      this.out += `${states[0]} -> ${states[1]
      } [taillabel = "${value[0]}", headlabel="${value[1]}"];\n`;
    });
  }

  public findStateImplementations() {
    // Buscar implementaciones de las funciones Estado
    for (; this.line < this.lines.length; this.line += 1) {
      // find: [.somethingLikeThis] = {
      const matches = this.lines[this.line].match(Regex.func);

      if (matches) {
        const tokens = matches[0].match(Regex.identifier) ?? [""];

        if (this.states.has(tokens[0])) {
          const value = this.states.get(tokens[0]) ?? [0, 0, 0];
          value[1] = this.linePlus;
          this.states.delete(tokens[0]);
          this.states.set(tokens[0], value);

          console.log(`matches ${this.linePlus}. ${tokens[0]}`);
        }
      }
    }
  }

  public processStateGroups() {
    let pen2 = ""; // ", penwidth = 2";
    let sub = ""; // ", peripheries=2";
    let lSub = "";
    let rSub = "";
    let dotted = ""; // "style = dotted";

    this.groups.forEach((groupStates, key) => {
      if (groupStates.length > 0) {
        this.out += `subgraph cluster_${key}{\nlabel = "${key}"
                  color = gray 
                  fontcolor = gray   
                  margin = 30
                  style = rounded
                  `;
      }

      groupStates.forEach((groupState) => {
        const value = this.states.get(groupState) ?? [0, 0, 0];

        if (groupState === this.firstState) {
          pen2 = ", penwidth = 3";
        } else {
          pen2 = "";
        }

        if (value[2] === 1) {
          sub = ", peripheries=2";
          lSub = "[ ";
          rSub = " ]";
        } else {
          sub = "";
          lSub = "";
          rSub = "";
        }

        if (value[1] === 0) {
          dotted = " style = dotted ";
        } else {
          dotted = "";
        }
        this.out += `${groupState}[${dotted}label="(${value[0]})\\n\\n   ${lSub}${value[1]}. ${groupState}${rSub}   \\n\\n"${pen2}${sub}];\n`;
      });

      this.out += "};\n";
    });
  } // processStateGroups
}
