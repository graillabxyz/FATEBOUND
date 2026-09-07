import { useState } from "react";
import { GLOSSARY } from "../content/terminology";
import { Omen } from "./components";
import { omenById } from "../content/omens";
import { FaceExplanation } from "./OmenFaces";
export const TUTORIAL_STEPS = [
  ["Legend", "This is your Legend. Reduce the enemy Legend to 0 Life to win."],
  [
    "Hand",
    "These four Cards are your Hand. Chosen before battle, yours for the entire Match.",
  ],
  [
    "Omens",
    "Choose three collectible Omens before battle. Their faces are fixed.",
  ],
  [
    "Faces",
    "Omens can have Values, Sigils, or Voids. Tap a face below to inspect it.",
  ],
  [
    "Roll",
    "Roll your Omens. The opening player chooses 1, the second chooses 2. All 3 from your second Turn. Initiative winner always goes first.",
  ],
  [
    "Act",
    "Spend Values or Sigils to activate Cards and Legend abilities. Higher Values are not always better.",
  ],
  [
    "Focus",
    "Use Focus to Shift by 1 or Flip to the opposite face. Shift costs 1; Flip costs 2.",
  ],
  [
    "Hold",
    "You don’t have to spend every Omen on your Turn. End your Turn to Hold unused Omens.",
  ],
  [
    "React",
    "Held Omens can activate Reactions during your opponent’s Turn. React or Pass within 5 seconds.",
  ],
  [
    "Ward",
    "Gain Ward to absorb damage before Life. Held Omens and Ward expire at your next Turn start.",
  ],
] as const;
export function TutorialSteps() {
  const [step, setStep] = useState(0),
    [face, setFace] = useState(0);
  const omen = omenById["guardian-d6"];
  return (
    <div className="tutorial-steps">
      <small>
        {step + 1} / {TUTORIAL_STEPS.length}
      </small>
      <h3>{TUTORIAL_STEPS[step][0]}</h3>
      <p>{TUTORIAL_STEPS[step][1]}</p>
      {step === 3 && (
        <>
          <div className="tutorial-face-demo">
            {[1, 5, 0].map((i) => (
              <Omen
                key={i}
                definition={omen}
                face={omen.faces[i]}
                selected={face === i}
                onClick={() => setFace(i)}
              />
            ))}
          </div>
          <FaceExplanation face={omen.faces[face]} />
        </>
      )}
      <div className="tutorial-step-buttons">
        <button disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </button>
        <button disabled={step === 9} onClick={() => setStep(step + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
export function Glossary() {
  return (
    <div className="mechanical-glossary">
      <h3>OMNIPATH glossary</h3>
      {GLOSSARY.map(([term, definition]) => (
        <details key={term}>
          <summary>{term}</summary>
          <p>{definition}</p>
        </details>
      ))}
    </div>
  );
}
