import { useState } from "react";
import { GLOSSARY } from "../content/terminology";
import { Omen, Modal } from "./components";
import { omenById } from "../content/omens";
import { FaceExplanation } from "./OmenFaces";
export const TUTORIAL_STEPS = [
  ["Legend", "This is your Legend. Reduce the enemy Legend to 0 Life to win."],
  [
    "Hand",
    "Choose four Cards from one shared pool. Your Legend’s Affinities determine compatibility. They stay reusable all Match.",
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
    "A requirement of two Values totaling 11+ spends BOTH Omens. They cannot be used again before your next roll. The Card stays reusable in your Hand.",
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
    "2 Ward blocks 2 damage, then is gone. A 3-damage attack removes 2 Ward and 1 Life. Leftover Ward expires at your next turn start.",
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
        <button
          disabled={step === TUTORIAL_STEPS.length - 1}
          onClick={() => setStep(step + 1)}
        >
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

export function BattleRules({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="What happens on the table?"
      eyebrow="BATTLE RULES"
      onClose={onClose}
    >
      <div className="battle-rules-copy">
        <h3>Roll → spend or hold → React</h3>
        <p>
          The opening player rolls 1 Omen, the second rolls 2. From your second
          turn onward, roll all 3.
        </p>
        <p>
          <strong>Two Values totaling 11+</strong> means selecting two Omens,
          such as 5 + 6, and spending both. They cannot be reused until your
          next roll.
        </p>
        <h3>Cards resolve, then remain in your Hand</h3>
        <p>
          Your declared Card becomes public. The opponent gets one Reaction
          window. Resolve the abilities; paid Omens remain Spent. No trap or
          creature is placed on the table.
        </p>
        <p>
          Cards stay reusable and known for the rest of the match. Only explicit
          statuses, shown beside a Legend, persist.
        </p>
        <h3>Ward absorbs damage point for point</h3>
        <p>
          Spend a numbered Omen for 1 Ward, regardless of its Value. A Ward
          Sigil grants its printed amount. With 2 Ward, a 3-damage attack
          consumes both Ward and removes 1 Life. Remaining Ward expires at the
          start of that Legend’s next turn.
        </p>
        <h3>Held Omens are your response</h3>
        <p>
          End your turn to hold unused results. Spend them on a Reaction or
          universal Ward during the opponent’s turn. They expire immediately
          before your next roll.
        </p>
        <p>
          Tap a Card’s inspect button for its cost, timing and exact effect.
          Battle timers continue while reading.
        </p>
      </div>
    </Modal>
  );
}
