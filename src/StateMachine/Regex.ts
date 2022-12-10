export default class MachineRegex {
  static identifier = /[_a-zA-Z][_a-zA-Z0-9]*/g;

  static betweenBracketsDot = /\[ *.(.*?) *\]/; // [.somethingLikeThis]

  static messageColonState = /.[_a-zA-Z][_a-zA-Z0-9]* *: *.[_a-zA-Z][_a-zA-Z0-9]*/; // .messageID : .stateID

  static func = / *\[ *[ *.[_a-zA-Z][_a-zA-Z0-9]* *\] *= *{/; // [.somethingLikeThis] = {

  static slash = /\/*/g;

  static endingBracket = /^(?=.*\])(?!.*\[).*/;
}
