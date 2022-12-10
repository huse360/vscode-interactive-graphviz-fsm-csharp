export default class {
  static dotBegin = `
    digraph {
        layout="neato";
       
       graph [
           splines=true; 
           sep =`
           + ` 1;
           overlap = true      
       ];
       
       node [
           color = blue, 
           shape = circle
           width=1.6, 
           height=1.6, 
           //style=rounded,
       
           penwidth = 1,
           fontsize=20,
   
           margin = 0
           
           
       ];
       
       edge [
           color=green, 
           //minlen = 2,
           penwidth = 1.2,
           fontcolor=blue,
           fontsize="15pt",
           margin = 2,
           arrowhead = "none"
           len = 5
           
       ];


    `;

  static dotEnd = "}";

  static dotMarkerBegin = "#Dot";

  static dotMarkerEnd = "#EndDot";

  static stateMarkerBegin = "#States";

  static stateMarkerEnd = "#EndStates";

  static subroutine = "#Subroutine";

  static stateGroupBegin = "#Group";

  static stateGroupEnd = "#EndGroup";

  static initialGroupName = "Main";
}
