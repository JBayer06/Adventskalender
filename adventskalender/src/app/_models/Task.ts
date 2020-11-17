
/*    +-----------------------------------------------------------------------+    */
/*    |    Do not edit this file directly.                                    |    */
/*    |    It was copied by redundancyJS.                                     |    */
/*    |    To modify it, first edit the source file (see redundancy.json).    |    */
/*    |    Then, run "npx redundancyjs" in the terminal.                      |    */
/*    +-----------------------------------------------------------------------+    */

/* do not edit */ export type Field = {
/* do not edit */     row: number;
/* do not edit */     col: string;
/* do not edit */ }
/* do not edit */ 
/* do not edit */ export type Task = {
/* do not edit */     day: number;
/* do not edit */     status?: TaskStatus;
/* do not edit */     solutionStatus?: SolutionStatus;
/* do not edit */     guess?: Field;
/* do not edit */     young: {
/* do not edit */         description: string;
/* do not edit */         solutions: Field[];
/* do not edit */     };
/* do not edit */     old: {
/* do not edit */         description: string;
/* do not edit */         solutions: Field[];
/* do not edit */     };
/* do not edit */ };
/* do not edit */ 
/* do not edit */ export enum TaskStatus {
/* do not edit */     LOCKED = "LOCKED",
/* do not edit */     OPEN = "OPEN",
/* do not edit */     SOLVED = "SOLVED",
/* do not edit */ }
/* do not edit */ 
/* do not edit */ export enum SolutionStatus {
/* do not edit */     CORRECT = "CORRECT",
/* do not edit */     INCORRECT = "INCORRECT",
/* do not edit */ }
/* do not edit */