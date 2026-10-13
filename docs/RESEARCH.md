# Research and Standards Map

## Implementation status

This bibliography is retained from the immutable source baseline. [The original research document](archive/build-week/docs/RESEARCH.md) remains available. Citations explain ideas and boundaries; they do not establish implementation of every cited method or validation against measured rooms.

| Area | Current use | Boundary |
| --- | --- | --- |
| Image sources | First-order and bounded blocked-route second-order segment/patch paths | Interactive geometry; no wave solver/higher-order runtime |
| Eyring | Three-band estimated RT60 with clamps and preset surfaces | No measured/certified architectural-acoustics output |
| Schroeder | Persistent browser late-reverb network | FDN papers are research context; no FDN renderer |
| P5 receiver connection | Deterministic sampling/accumulation/stationary benchmark | No audible late field or convergence certification |
| P6 materials/media | Six-band projection and bounded atmospheric helpers | Live three-band/343 m/s; no audible atmosphere control |
| P7 directional histogram | Mid-energy direction × delay bins | No directional FDN, Ambisonics, multi-band decay or virtual sources |
| HRTF datasets | Binaural background | Browser owns its dataset; no CIPIC/MIT/KEMAR import |
| Diffraction/dereverberation | Scope boundary | Portal routing is not diffraction; mono import is not dry-source recovery |

[Archived phase records](archive/build-week/docs/3d-extension/P0_BASELINE.md) preserve contracts and original evidence. Plans and removed Lab preview descriptions are historical context, not live features.

## Reproducible research contributions

Use the Acoustic Research template with a validated minimal scene, units, reference, tolerance, repeatable sample/seed budget, environment, metric, and dataset licensing. Separate physical relations, numerical approximations, optimizations, and perceptual tuning. A passing regression establishes its covered contract only.

Runtime integration of a data-only helper requires an ADR, compatibility/performance evidence, browser rendering checks, and suitable listening validation. Accuracy claims need independent measurement evidence. Verify primary papers/official standards before extending the model.

## Foundational room acoustics

1. J. B. Allen and D. A. Berkley, "Image method for efficiently simulating small-room acoustics," Journal of the Acoustical Society of America, 65(4), 943–950, 1979. DOI: 10.1121/1.382599.
   Use: conceptual foundation for image-source reflections.

2. Carl F. Eyring, "Reverberation Time in 'Dead' Rooms," Journal of the Acoustical Society of America, 1, 217–241, 1930.
   Use: logarithmic reverberation-time estimate used in the live three-band model.

3. M. R. Schroeder, "Natural Sounding Artificial Reverberation," Journal of the Audio Engineering Society, 10(3), 219–223, 1962.
   Use: parallel comb and serial all-pass late reverberation.

4. J.-M. Jot and A. Chaigne, "Digital Delay Networks for Designing Artificial Reverberators," 90th AES Convention, 1991.
   Use: transition from simple Schroeder structures toward controlled delay networks/FDNs.

## Modern hybrid and interactive rendering

5. Stephan D. Ewert et al., "Computationally-efficient and perceptually-motivated rendering of diffuse reflections in room acoustics simulation," arXiv:2306.16696, 2023.
   Use: supports a hybrid design combining fast image-source early reflections with diffuse late reverberation/FDN.

6. Carl Schissler and Dinesh Manocha, "Interactive Sound Rendering on Mobile Devices using Ray-Parameterized Reverberation Filters," arXiv:1803.00430, 2018.
   Use: supports low-rate propagation estimation driving reverberation filters for interactive systems.

7. Sebastian J. Schlecht and Emanuël A. P. Habets, "Modal Decomposition of Feedback Delay Networks," IEEE Transactions on Signal Processing, 2019. DOI: 10.1109/TSP.2019.2937286; arXiv:1901.08865.
   Use: FDN theory and unimplemented future research context.

8. Gloria Dal Santo et al., "Efficient Optimization of Feedback Delay Networks for Smooth Reverberation," arXiv:2402.11216, 2024.
   Use: coloration/smoothness concerns in FDN design; no FDN runtime is implemented.

## Diffraction boundary

9. Chunxiao Cao et al., "BEDRF: Bidirectional Edge Diffraction Response Function for Interactive Sound Propagation," arXiv:2306.01974, 2023.
   Use: diffraction research boundary. The live workbench uses explicit portal routing and labels it as an approximation.

## Binaural inverse-processing boundary

10. Sania Gul et al., "Recycling an anechoic pre-trained speech separation deep neural network for binaural dereverberation of a single source," arXiv:2208.04626, 2022.
    Use: shows that even constrained single-source binaural dereverberation uses specialized learned priors; arbitrary lightweight de-spatialization is excluded.

## HRTF and browser audio

11. W3C, "Web Audio API 1.1."
    URL: https://www.w3.org/TR/webaudio/
    Use: normative definitions for `PannerNode`, HRTF mode, distance models, `ConvolverNode`, and `AudioWorkletProcessor`.

12. V. R. Algazi, R. O. Duda, D. M. Thompson, and C. Avendano, "The CIPIC HRTF Database," IEEE WASPAA, 2001.
    Use: measured HRTF background. The application does not load CIPIC directly.

13. ISO 9613-1, "Acoustics — Attenuation of sound during propagation outdoors — Part 1: Calculation of the absorption of sound by the atmosphere," 1993.
    Use: source form for P6-A's bounded, data-only molecular air-absorption helper. It is not used to make a measurement-accuracy claim.

## OpenAI and Codex

14. OpenAI, "Structured model outputs."
    URL: https://developers.openai.com/api/docs/guides/structured-outputs
    Use: strict JSON Schema for GPT-5.6 scene compilation.

15. OpenAI, "Custom instructions with AGENTS.md."
    URL: https://learn.chatgpt.com/docs/agent-configuration/agents-md
    Use: persistent Codex repository instructions and nested overrides.

16. OpenAI Build Week on Devpost.
    URL: https://openai.devpost.com/
    Use: historical release submission context only, not a current maintenance requirement.

## Evidence hierarchy

When implementation details disagree:

1. applicable official standards and W3C/provider documentation;
2. peer-reviewed paper or author preprint;
3. this project specification;
4. tutorials/blogs;
5. intuition.

Use primary technical authorities for model/runtime claims. This map preserves source-era citations; it is not a fresh bibliographic verification of every paper's metadata or URL availability.
