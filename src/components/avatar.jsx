import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

// Viseme mapping
const visemeMap = {
  X: "viseme_sil",   // silence
  A: "viseme_aa",    // open mouth (ah)
  B: "viseme_PP",    // closed lips (p, b, m)
  C: "viseme_I",     // smiling mouth (ee)
  D: "viseme_DD",    // tongue behind teeth (d, t)
  E: "viseme_E",     // wide mouth (eh)
  F: "viseme_FF",    // teeth on lip (f, v)
  G: "viseme_kk",    // back of throat (k, g)
  H: "viseme_nn",    // tongue touching roof (n, l)
  // Optional extras
  CH: "viseme_CH",   // ch, sh
  R: "viseme_RR",    // round mouth (r)
  O: "viseme_O",     // round lips (oh)
  U: "viseme_U",     // puckered lips (oo)
  S: "viseme_SS",    // hissing (s, z)
};

function AvatarScene({ audioRef, mouthCues = [], isTalking, triggerWave, triggerBow }) {
  const { scene } = useGLTF("/models/68bc44744b2306b86e39ec94.glb");

  // ✅ Fix: useState for re-render
  const [clonedScene, setClonedScene] = useState(null);

  const headRef = useRef();
  const mixer = useRef();
  const actions = useRef({});

  useEffect(() => {
    const cloned = SkeletonUtils.clone(scene);
    setClonedScene(cloned); // 🔥 trigger render update

    cloned.traverse((child) => {
      if (child.isMesh && child.name === "Wolf3D_Head") {
        headRef.current = child;
      }
    });

    mixer.current = new THREE.AnimationMixer(cloned);

    const loader = new FBXLoader();

    loader.load("/animations/Standing Idle.fbx", (anim) => {
      if (anim.animations.length > 0) {
        actions.current.idle = mixer.current.clipAction(anim.animations[0]);
        actions.current.idle.play();
      }
    });

    loader.load("/animations/Talking.fbx", (anim) => {
      if (anim.animations.length > 0) {
        actions.current.talking = mixer.current.clipAction(anim.animations[0]);
      }
    });

    loader.load("/animations/Waving1.fbx", (anim) => {
      if (anim.animations.length > 0) {
        actions.current.waving = mixer.current.clipAction(anim.animations[0]);
      }
    });

    loader.load("/animations/Quick Formal Bow.fbx", (anim) => {
      if (anim.animations.length > 0) {
        actions.current.bow = mixer.current.clipAction(anim.animations[0]);
      }
    });
  }, [scene]);

  // Handle talking / idle state
  useEffect(() => {
    if (!actions.current.idle || !actions.current.talking) return;

    if (isTalking) {
      actions.current.idle.stop();
      actions.current.talking.reset().play();
    } else {
      actions.current.talking?.stop();
      actions.current.idle.reset().play();
    }
  }, [isTalking]);

  // Handle wave trigger
  useEffect(() => {
    if (triggerWave && actions.current.waving) {
      actions.current.idle?.stop(); // stop idle while waving
      actions.current.waving.reset().play();

      // Ensure wave only plays once
      actions.current.waving.clampWhenFinished = true;
      actions.current.waving.loop = THREE.LoopOnce;

      actions.current.waving.getMixer().addEventListener("finished", (e) => {
        if (e.action === actions.current.waving) {
          actions.current.idle?.reset().play(); // ✅ return to Idle
        }
      });
    }
  }, [triggerWave]);

  // Handle bow trigger
  useEffect(() => {
    if (triggerBow && actions.current.bow) {
      actions.current.idle?.stop(); // stop idle
      actions.current.bow.reset().play();

      // 🟢 When bow finishes, return to idle
      actions.current.bow.clampWhenFinished = true;
      actions.current.bow.loop = THREE.LoopOnce;

      actions.current.bow.getMixer().addEventListener("finished", (e) => {
        if (e.action === actions.current.bow) {
          actions.current.idle?.reset().play(); // back to idle
        }
      });
    }
  }, [triggerBow]);

  useEffect(() => {
    console.log("MouthCues received in AvatarScene:", mouthCues);
  }, [mouthCues]);

  useEffect(() => {
    if (headRef.current) {
      console.log("Morph targets available:", headRef.current.morphTargetDictionary);
    }
  }, [headRef.current]);

  // Lip-sync loop
  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta);

    if (!mouthCues || mouthCues.length === 0) return;
    if (!audioRef.current || !headRef.current) return;

    const time = audioRef.current.currentTime;
    let currentCue = mouthCues.find(
      (cue) => time >= cue.start && time < cue.end
    );

    const head = headRef.current;

    // Reset all morphs
    Object.values(visemeMap).forEach((v) => {
      const idx = head.morphTargetDictionary[v];
      if (idx !== undefined) head.morphTargetInfluences[idx] = 0;
    });

    // Apply active morph
    if (currentCue) {
      const morphName = visemeMap[currentCue.value];
      const morphIndex = head.morphTargetDictionary[morphName];
      console.log("Cue:", currentCue.value, "→ Morph:", morphName, "→ Index:", morphIndex);
      if (morphIndex !== undefined) {
        head.morphTargetInfluences[morphIndex] = 1;
      }
    }
  });

  return clonedScene ? (
    <primitive
      object={clonedScene}
      scale={[2.2, 2.2, 1.8]}
      position={[0, -2.3, 0]}
    />
  ) : null;
}

// ✅ Wrapper component
export default function Avatar({ audioRef, mouthCues, isTalking, triggerWave, triggerBow }) {
  return (
    <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
      <ambientLight intensity={1} />
      <directionalLight position={[0, 5, 5]} intensity={1} />
      <AvatarScene
        audioRef={audioRef}
        mouthCues={mouthCues}
        isTalking={isTalking}
        triggerWave={triggerWave}
        triggerBow={triggerBow}
      />
    </Canvas>
  );
}

useGLTF.preload("/models/68bc44744b2306b86e39ec94.glb");
