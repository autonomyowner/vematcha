'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../../components/LanguageProvider';
import Header from '../../components/Header';

interface BlogArticle {
  id: string;
  titleEn: string;
  titleFr: string;
  excerptEn: string;
  excerptFr: string;
  category: string;
  readTime: number;
  date: string;
  contentEn: React.ReactNode;
  contentFr: React.ReactNode;
}

const articles: BlogArticle[] = [
  {
    id: 'emdr-science',
    titleEn: 'EMDR Therapy: The Science Behind Eye Movement and Trauma Healing',
    titleFr: 'Thérapie EMDR : La Science Derrière le Mouvement Oculaire et la Guérison du Traumatisme',
    excerptEn: 'Discover the evidence-based research supporting EMDR as a first-line treatment for PTSD, backed by over 30 randomized controlled trials.',
    excerptFr: 'Découvrez les recherches scientifiques qui soutiennent l\'EMDR comme traitement de première ligne pour le TSPT, appuyé par plus de 30 essais contrôlés randomisés.',
    category: 'Research',
    readTime: 8,
    date: '2024-12-15',
    contentEn: (
      <>
        <p className="lead">
          Eye Movement Desensitization and Reprocessing (EMDR) has emerged as one of the most thoroughly
          researched psychotherapies for trauma. With recognition from the World Health Organization,
          American Psychological Association, and Department of Veterans Affairs, EMDR stands as a
          gold-standard treatment for post-traumatic stress disorder.
        </p>

        <h2>What the Research Shows</h2>
        <p>
          A comprehensive 2024 meta-analysis by Wright et al. found that EMDR was equally effective
          as other top-tier trauma therapies like Cognitive Processing Therapy (CPT) and Prolonged
          Exposure (PE). This analysis examined data across multiple randomized controlled trials,
          making it one of the most comprehensive evaluations to date.
        </p>
        <p>
          The 2025 systematic review published in the <em>British Journal of Psychology</em> by Simpson
          et al. provided updated clinical and cost-effectiveness evidence, further cementing EMDR's
          position as an evidence-based intervention.
        </p>

        <h2>Beyond PTSD: Expanding Applications</h2>
        <p>
          Recent research has explored EMDR's potential beyond trauma. A September 2024 meta-analysis
          published in the <em>Journal of Clinical Medicine</em> analyzed 25 studies with 1,042
          participants and found significant effects on depression symptoms (Hedges' g = 0.75).
          Notably, the meta-regression indicated that EMDR showed greater effectiveness in cases
          of severe depression.
        </p>
        <p>
          Researchers continue to investigate EMDR's potential for:
        </p>
        <ul>
          <li>Treatment-resistant depression</li>
          <li>Specific phobias</li>
          <li>Anxiety and panic disorders</li>
          <li>Emotional regulation difficulties</li>
        </ul>

        <h2>How EMDR Works</h2>
        <p>
          EMDR therapy involves recalling distressing experiences while receiving bilateral
          stimulation, typically through guided eye movements. This process appears to facilitate
          the brain's natural information processing system, allowing traumatic memories to be
          reprocessed and integrated in a less distressing way.
        </p>
        <p>
          The therapy is typically delivered in eight phases, including history-taking, preparation,
          assessment, desensitization, installation, body scan, closure, and reevaluation.
        </p>

        <h2>Global Recognition</h2>
        <p>
          EMDR therapy is recommended as a first-line treatment for PTSD by major health organizations:
        </p>
        <ul>
          <li>World Health Organization (WHO)</li>
          <li>American Psychological Association (APA)</li>
          <li>International Society for Traumatic Stress Studies (ISTSS)</li>
          <li>Department of Veterans Affairs/Department of Defense (VA/DoD)</li>
        </ul>

        <h2>Conclusion</h2>
        <p>
          With over 30 published randomized controlled trials supporting its effectiveness in
          both adults and children, EMDR represents a well-validated approach to trauma treatment.
          As research continues to expand into new applications, EMDR's role in mental health
          treatment is likely to grow even further.
        </p>

        <div className="sources">
          <h3>Sources</h3>
          <ul>
            <li><a href="https://onlinelibrary.wiley.com/doi/10.1002/jts.23012" target="_blank" rel="noopener noreferrer">State of the science: EMDR therapy - Journal of Traumatic Stress (2024)</a></li>
            <li><a href="https://www.mdpi.com/2077-0383/13/18/5633" target="_blank" rel="noopener noreferrer">EMDR for Depression Meta-Analysis - Journal of Clinical Medicine (2024)</a></li>
            <li><a href="https://bpspsychub.onlinelibrary.wiley.com/doi/pdf/10.1111/bjop.70005" target="_blank" rel="noopener noreferrer">Clinical and cost-effectiveness of EMDR - British Journal of Psychology (2025)</a></li>
            <li><a href="https://www.emdria.org/about-emdr-therapy/recent-research-about-emdr/" target="_blank" rel="noopener noreferrer">Recent Research on EMDR - EMDR International Association</a></li>
          </ul>
        </div>
      </>
    ),
    contentFr: (
      <>
        <p className="lead">
          La désensibilisation et retraitement par les mouvements oculaires (EMDR) est devenue l'une
          des psychothérapies les plus étudiées pour le traumatisme. Reconnue par l'Organisation
          mondiale de la santé, l'American Psychological Association et le Département des anciens
          combattants, l'EMDR est un traitement de référence pour le trouble de stress post-traumatique.
        </p>

        <h2>Ce que la Recherche Démontre</h2>
        <p>
          Une méta-analyse complète de 2024 par Wright et al. a révélé que l'EMDR était aussi efficace
          que d'autres thérapies de premier plan comme la thérapie de traitement cognitif (CPT) et
          l'exposition prolongée (PE). Cette analyse a examiné des données provenant de multiples
          essais contrôlés randomisés.
        </p>
        <p>
          La revue systématique de 2025 publiée dans le <em>British Journal of Psychology</em> par
          Simpson et al. a fourni des preuves actualisées de l'efficacité clinique et économique,
          confirmant la position de l'EMDR comme intervention fondée sur des preuves.
        </p>

        <h2>Au-delà du TSPT : Applications Élargies</h2>
        <p>
          Des recherches récentes ont exploré le potentiel de l'EMDR au-delà du traumatisme. Une
          méta-analyse de septembre 2024 publiée dans le <em>Journal of Clinical Medicine</em> a
          analysé 25 études avec 1 042 participants et a trouvé des effets significatifs sur les
          symptômes de dépression (Hedges' g = 0,75).
        </p>
        <p>
          Les chercheurs continuent d'étudier le potentiel de l'EMDR pour :
        </p>
        <ul>
          <li>La dépression résistante au traitement</li>
          <li>Les phobies spécifiques</li>
          <li>Les troubles anxieux et paniques</li>
          <li>Les difficultés de régulation émotionnelle</li>
        </ul>

        <h2>Comment Fonctionne l'EMDR</h2>
        <p>
          La thérapie EMDR consiste à se remémorer des expériences stressantes tout en recevant
          une stimulation bilatérale, généralement par des mouvements oculaires guidés. Ce processus
          semble faciliter le système naturel de traitement de l'information du cerveau.
        </p>

        <h2>Reconnaissance Mondiale</h2>
        <p>
          La thérapie EMDR est recommandée comme traitement de première ligne pour le TSPT par :
        </p>
        <ul>
          <li>Organisation mondiale de la santé (OMS)</li>
          <li>American Psychological Association (APA)</li>
          <li>International Society for Traumatic Stress Studies (ISTSS)</li>
          <li>Department of Veterans Affairs/Department of Defense (VA/DoD)</li>
        </ul>

        <h2>Conclusion</h2>
        <p>
          Avec plus de 30 essais contrôlés randomisés publiés soutenant son efficacité chez les
          adultes et les enfants, l'EMDR représente une approche bien validée du traitement du
          traumatisme.
        </p>

        <div className="sources">
          <h3>Sources</h3>
          <ul>
            <li><a href="https://onlinelibrary.wiley.com/doi/10.1002/jts.23012" target="_blank" rel="noopener noreferrer">State of the science: EMDR therapy - Journal of Traumatic Stress (2024)</a></li>
            <li><a href="https://www.mdpi.com/2077-0383/13/18/5633" target="_blank" rel="noopener noreferrer">EMDR for Depression Meta-Analysis - Journal of Clinical Medicine (2024)</a></li>
            <li><a href="https://bpspsychub.onlinelibrary.wiley.com/doi/pdf/10.1111/bjop.70005" target="_blank" rel="noopener noreferrer">Clinical and cost-effectiveness of EMDR - British Journal of Psychology (2025)</a></li>
            <li><a href="https://www.emdria.org/about-emdr-therapy/recent-research-about-emdr/" target="_blank" rel="noopener noreferrer">Recent Research on EMDR - EMDR International Association</a></li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: 'flash-technique',
    titleEn: 'The Flash Technique: A Gentler Approach to Trauma Processing',
    titleFr: 'La Technique Flash : Une Approche Plus Douce du Traitement du Traumatisme',
    excerptEn: 'Explore the emerging research on Flash Technique, a novel intervention that reduces trauma-related distress with minimal emotional pain during treatment.',
    excerptFr: 'Explorez les recherches émergentes sur la Technique Flash, une intervention novatrice qui réduit la détresse liée au traumatisme avec un minimum de douleur émotionnelle.',
    category: 'Innovation',
    readTime: 7,
    date: '2024-12-10',
    contentEn: (
      <>
        <p className="lead">
          The Flash Technique (FT) represents an innovative approach to trauma treatment that allows
          individuals to process disturbing memories without the intense emotional distress typically
          associated with trauma-focused therapies. This novel intervention is gaining attention in
          the clinical and research communities for its rapid results and patient-friendly approach.
        </p>

        <h2>What is the Flash Technique?</h2>
        <p>
          Unlike traditional trauma therapies that require detailed recall of traumatic events, the
          Flash Technique works by having clients engage in positive imagery while being discouraged
          from actively recollecting the targeted disturbing memory. This unique approach minimizes
          subjective disturbance during the treatment process.
        </p>

        <h2>Research Evidence</h2>
        <p>
          A landmark 2024 study published in <em>Frontiers in Psychiatry</em> by Manfield et al.
          reported on four similar studies conducted in the United States, Australia, and Uganda.
          The results were remarkable:
        </p>
        <ul>
          <li>Mean reduction in disturbance exceeded two-thirds across all studies</li>
          <li>Results were statistically significant (p &lt; 0.001) with very large effect sizes</li>
          <li>Of 813 sessions (654 subjects), only two reported slight increases in disturbance</li>
          <li>4-week follow-up showed maintenance of benefits or further improvement</li>
          <li>18-month follow-up with high-distress individuals showed sustained gains</li>
        </ul>

        <h2>Flash Technique vs. EMDR</h2>
        <p>
          A randomized controlled trial compared Flash Technique to EMDR and found that 8 minutes
          of FT was as effective as 8 minutes of EMDR in symptom reduction. Importantly, the Flash
          Technique was better tolerated by participants, suggesting it may be particularly valuable
          for individuals who find traditional trauma processing too overwhelming.
        </p>
        <p>
          The ENHANCE trial, currently underway, aims to determine the differential effectiveness,
          efficiency, and acceptability of EMDR therapy, EMDR 2.0, and the Flash Technique in
          individuals diagnosed with PTSD.
        </p>

        <h2>Real-World Applications</h2>
        <p>
          <strong>Earthquake Survivors (Turkey, 2023):</strong> Following the devastating
          Urfa-Kahramanmaraş-Hatay earthquakes, researchers conducted a randomized controlled
          study with 410 participants affected by the disaster. The study compared EMDR Flash
          Technique against a control group, measuring PTSD symptoms using the PCL-5 and
          depression, anxiety, and stress using the DASS-21.
        </p>
        <p>
          <strong>Migrant Populations:</strong> A study with migrants showed IES-R scores
          dropping from a pre-treatment mean of 45.97 to 25.33 post-treatment (p &lt; 0.00001,
          Cohen's d = 1.4). This large effect size suggests the technique may be particularly
          useful for vulnerable populations with limited access to traditional mental health services.
        </p>

        <h2>How It Works: The Science</h2>
        <p>
          According to a 2024 publication in the <em>Journal of EMDR Practice and Research</em>,
          the effectiveness of the Flash Technique can be explained by the Broaden-and-Build Theory
          of Positive Emotion. By engaging positive imagery, the technique may help "broaden"
          cognitive and emotional resources, allowing for more adaptive processing of traumatic
          material.
        </p>

        <h2>Accessibility and Training</h2>
        <p>
          One particularly promising finding is that the scripted FT protocol appears usable
          even by less experienced clinicians, potentially paving the way for its use as a
          low-intensity trauma intervention in settings where specialized trauma therapists
          are scarce.
        </p>

        <h2>Conclusion</h2>
        <p>
          With seven research studies validating this technique, Flash Technique offers a
          promising alternative or complement to traditional trauma therapies. Its emphasis
          on positive experiences as a healing agent, combined with its tolerability, makes
          it an exciting development in trauma treatment.
        </p>

        <div className="sources">
          <h3>Sources</h3>
          <ul>
            <li><a href="https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2023.1273704/full" target="_blank" rel="noopener noreferrer">Preliminary evidence for Flash Technique - Frontiers in Psychiatry (2024)</a></li>
            <li><a href="https://spj.science.org/doi/10.1891/EMDR-2024-0015" target="_blank" rel="noopener noreferrer">Flash Technique and Broaden-and-Build Theory - Journal of EMDR Practice and Research (2024)</a></li>
            <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10665892/" target="_blank" rel="noopener noreferrer">ENHANCE Trial Protocol - PMC (2023)</a></li>
            <li><a href="https://flashtechnique.com/wp/research/" target="_blank" rel="noopener noreferrer">Published Research About the Flash Technique</a></li>
          </ul>
        </div>
      </>
    ),
    contentFr: (
      <>
        <p className="lead">
          La Technique Flash (FT) représente une approche innovante du traitement du traumatisme
          qui permet aux individus de traiter les souvenirs perturbants sans la détresse émotionnelle
          intense typiquement associée aux thérapies centrées sur le traumatisme.
        </p>

        <h2>Qu'est-ce que la Technique Flash ?</h2>
        <p>
          Contrairement aux thérapies traditionnelles qui nécessitent un rappel détaillé des événements
          traumatiques, la Technique Flash fonctionne en demandant aux clients de s'engager dans une
          imagerie positive tout en étant découragés de se remémorer activement le souvenir perturbant
          ciblé.
        </p>

        <h2>Preuves de Recherche</h2>
        <p>
          Une étude marquante de 2024 publiée dans <em>Frontiers in Psychiatry</em> par Manfield et al.
          a rapporté des résultats remarquables :
        </p>
        <ul>
          <li>La réduction moyenne de la perturbation a dépassé les deux tiers dans toutes les études</li>
          <li>Les résultats étaient statistiquement significatifs (p &lt; 0,001) avec de très grandes tailles d'effet</li>
          <li>Sur 813 séances (654 sujets), seulement deux ont signalé de légères augmentations de la perturbation</li>
          <li>Le suivi à 4 semaines a montré un maintien des bénéfices ou une amélioration supplémentaire</li>
          <li>Le suivi à 18 mois a montré des gains durables</li>
        </ul>

        <h2>Technique Flash vs. EMDR</h2>
        <p>
          Un essai contrôlé randomisé a révélé que 8 minutes de FT étaient aussi efficaces que
          8 minutes d'EMDR pour la réduction des symptômes. Surtout, la Technique Flash était
          mieux tolérée par les participants.
        </p>

        <h2>Applications Concrètes</h2>
        <p>
          <strong>Survivants du Tremblement de Terre (Turquie, 2023) :</strong> Suite aux
          tremblements de terre dévastateurs, les chercheurs ont mené une étude contrôlée
          randomisée avec 410 participants.
        </p>
        <p>
          <strong>Populations Migrantes :</strong> Une étude avec des migrants a montré une
          baisse des scores IES-R de 45,97 à 25,33 après traitement (Cohen's d = 1,4),
          suggérant une grande taille d'effet.
        </p>

        <h2>Comment Ça Marche : La Science</h2>
        <p>
          Selon une publication de 2024 dans le <em>Journal of EMDR Practice and Research</em>,
          l'efficacité de la Technique Flash peut être expliquée par la théorie de l'élargissement
          et de la construction des émotions positives.
        </p>

        <h2>Conclusion</h2>
        <p>
          Avec sept études de recherche validant cette technique, la Technique Flash offre une
          alternative prometteuse aux thérapies traditionnelles du traumatisme. Son accent sur
          les expériences positives comme agent de guérison en fait un développement passionnant.
        </p>

        <div className="sources">
          <h3>Sources</h3>
          <ul>
            <li><a href="https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2023.1273704/full" target="_blank" rel="noopener noreferrer">Preliminary evidence for Flash Technique - Frontiers in Psychiatry (2024)</a></li>
            <li><a href="https://spj.science.org/doi/10.1891/EMDR-2024-0015" target="_blank" rel="noopener noreferrer">Flash Technique and Broaden-and-Build Theory - Journal of EMDR Practice and Research (2024)</a></li>
            <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10665892/" target="_blank" rel="noopener noreferrer">ENHANCE Trial Protocol - PMC (2023)</a></li>
            <li><a href="https://flashtechnique.com/wp/research/" target="_blank" rel="noopener noreferrer">Published Research About the Flash Technique</a></li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: 'neuroplasticity-healing',
    titleEn: 'Neuroplasticity and Trauma: How Your Brain Can Heal Itself',
    titleFr: 'Neuroplasticité et Traumatisme : Comment Votre Cerveau Peut Se Guérir',
    excerptEn: 'Understand the science of neuroplasticity and how modern treatments leverage the brain\'s remarkable ability to rewire itself after trauma.',
    excerptFr: 'Comprenez la science de la neuroplasticité et comment les traitements modernes exploitent la remarquable capacité du cerveau à se recâbler après un traumatisme.',
    category: 'Neuroscience',
    readTime: 9,
    date: '2024-12-05',
    contentEn: (
      <>
        <p className="lead">
          The discovery that the adult brain can change and adapt throughout life has revolutionized
          our understanding of trauma recovery. Neuroplasticity—the brain's ability to form new neural
          connections and reorganize existing ones—offers hope for those affected by traumatic experiences
          and provides the scientific foundation for modern trauma treatments.
        </p>

        <h2>The Brain's Response to Trauma</h2>
        <p>
          Research has identified several brain regions involved in PTSD and early-life trauma:
        </p>
        <ul>
          <li><strong>Hippocampus:</strong> Essential for memory formation and contextual processing</li>
          <li><strong>Amygdala:</strong> The brain's threat detection center, often hyperactive after trauma</li>
          <li><strong>Prefrontal Cortex:</strong> Responsible for executive function and emotional regulation</li>
        </ul>
        <p>
          The connections between these regions are significantly impacted by trauma, with apparent
          changes in neurochemistry and synaptic connections between neurons. Neurotransmitters and
          hormones—including norepinephrine, dopamine, serotonin, and cortisol—are also affected.
        </p>

        <h2>The Neuroplastic Narrative: A New Framework</h2>
        <p>
          A 2023 paper published in <em>Frontiers in Psychiatry</em> introduced the "Neuroplastic
          Narrative" as a non-pathologizing biological foundation for understanding trauma. This
          framework emphasizes that the brain's changes following trauma represent adaptive responses
          rather than pathology—and importantly, these changes can be reversed.
        </p>
        <p>
          The Neuroplastic Narrative offers an alternative perspective for both those seeking help
          and those providing it, especially in cases where traditional diagnoses may be contested
          or where pathology has not been identified.
        </p>

        <h2>Neural Plasticity and Emotion Regulation (2025)</h2>
        <p>
          A groundbreaking 2025 study published in <em>Frontiers in Behavioral Neuroscience</em>
          examined the neural correlates of explicit emotion regulation following trauma. The
          research highlighted that:
        </p>
        <ul>
          <li>Difficulties in emotion regulation emerge as a key mechanism in PTSD development</li>
          <li>Real-time fMRI neurofeedback shows potential in treating PTSD by promoting direct neuroplasticity</li>
          <li>Understanding these mechanisms is crucial for both prevention and targeted treatment</li>
        </ul>

        <h2>Evidence-Based Treatments That Harness Neuroplasticity</h2>
        <p>
          <strong>Repetitive Transcranial Magnetic Stimulation (rTMS):</strong> Research in
          neuroimaging and blood biomarkers increasingly shows clinical relevance, allowing
          measurement of synaptic, functional, and structural changes involved in neuroplasticity.
          Understanding these effects can help improve treatment outcomes.
        </p>
        <p>
          <strong>Mindfulness-Based Interventions:</strong> Studies have reported increased
          resting-state connectivity between the posterior cingulate cortex and the dorsolateral
          prefrontal cortex following mindfulness-based exposure therapy in combat veterans with
          PTSD. These findings provide initial evidence for emotion regulation-related neural
          plasticity through mindfulness.
        </p>
        <p>
          <strong>Psychotherapy:</strong> Neuroplasticity may be the biological mechanism through
          which psychosocial interventions exert their therapeutic effects. For trauma survivors,
          therapy that helps reframe experiences—from "victim" to "survivor"—may be mediated by
          the reorganization and genesis of neurons.
        </p>

        <h2>The World's Largest Childhood Trauma Study</h2>
        <p>
          In February 2024, researchers published findings from what has been called the world's
          largest childhood trauma study, uncovering significant insights about brain rewiring
          following early-life adversity. The study revealed that experiencing trauma during
          childhood leads to complex physiological and functional brain transformations.
        </p>

        <h2>Implications for Recovery</h2>
        <p>
          The science of neuroplasticity carries a profoundly hopeful message: the brain that
          was changed by trauma can also be changed by healing experiences. Key principles for
          leveraging neuroplasticity in recovery include:
        </p>
        <ul>
          <li><strong>Repetition:</strong> New neural pathways strengthen with repeated use</li>
          <li><strong>Intensity:</strong> Focused, engaged practice promotes faster rewiring</li>
          <li><strong>Specificity:</strong> Targeted interventions address specific affected circuits</li>
          <li><strong>Salience:</strong> Emotionally meaningful experiences drive lasting change</li>
        </ul>

        <h2>Conclusion</h2>
        <p>
          The emerging understanding of neuroplasticity in trauma treatment represents a paradigm
          shift in mental health care. Rather than viewing trauma's effects as permanent damage,
          we now understand them as adaptations that—with the right interventions—can be reshaped.
          This knowledge empowers both clinicians and individuals on their healing journeys.
        </p>

        <div className="sources">
          <h3>Sources</h3>
          <ul>
            <li><a href="https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2023.1103718/full" target="_blank" rel="noopener noreferrer">The Neuroplastic Narrative - Frontiers in Psychiatry (2023)</a></li>
            <li><a href="https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2025.1523035/full" target="_blank" rel="noopener noreferrer">Neural correlates and plasticity of emotion regulation - Frontiers in Behavioral Neuroscience (2025)</a></li>
            <li><a href="https://pubmed.ncbi.nlm.nih.gov/38040046/" target="_blank" rel="noopener noreferrer">rTMS-Induced Neuroplasticity in Psychiatric Disorders - PubMed (2024)</a></li>
            <li><a href="https://www.oxjournal.org/childhood-and-trauma-a-neuroscience-perspective/" target="_blank" rel="noopener noreferrer">Childhood and Trauma: A Neuroscience Perspective - OxJournal</a></li>
          </ul>
        </div>
      </>
    ),
    contentFr: (
      <>
        <p className="lead">
          La découverte que le cerveau adulte peut changer et s'adapter tout au long de la vie a
          révolutionné notre compréhension de la récupération après un traumatisme. La neuroplasticité—
          la capacité du cerveau à former de nouvelles connexions neuronales et à réorganiser celles
          existantes—offre de l'espoir à ceux qui ont vécu des expériences traumatiques.
        </p>

        <h2>La Réponse du Cerveau au Traumatisme</h2>
        <p>
          La recherche a identifié plusieurs régions cérébrales impliquées dans le TSPT :
        </p>
        <ul>
          <li><strong>Hippocampe :</strong> Essentiel pour la formation de la mémoire</li>
          <li><strong>Amygdale :</strong> Le centre de détection des menaces du cerveau</li>
          <li><strong>Cortex Préfrontal :</strong> Responsable de la fonction exécutive et de la régulation émotionnelle</li>
        </ul>
        <p>
          Les connexions entre ces régions sont significativement affectées par le traumatisme,
          avec des changements apparents dans la neurochimie et les connexions synaptiques.
        </p>

        <h2>Le Récit Neuroplastique : Un Nouveau Cadre</h2>
        <p>
          Un article de 2023 publié dans <em>Frontiers in Psychiatry</em> a introduit le "Récit
          Neuroplastique" comme fondement biologique non pathologisant pour comprendre le traumatisme.
          Ce cadre souligne que les changements cérébraux suite au traumatisme représentent des
          réponses adaptatives—et peuvent être inversés.
        </p>

        <h2>Plasticité Neuronale et Régulation Émotionnelle (2025)</h2>
        <p>
          Une étude révolutionnaire de 2025 publiée dans <em>Frontiers in Behavioral Neuroscience</em>
          a examiné les corrélats neuronaux de la régulation émotionnelle explicite après un traumatisme :
        </p>
        <ul>
          <li>Les difficultés de régulation émotionnelle sont un mécanisme clé du développement du TSPT</li>
          <li>Le neurofeedback par IRMf en temps réel montre un potentiel pour traiter le TSPT</li>
          <li>Comprendre ces mécanismes est crucial pour la prévention et le traitement ciblé</li>
        </ul>

        <h2>Traitements Fondés sur les Preuves</h2>
        <p>
          <strong>Stimulation Magnétique Transcrânienne Répétitive (rTMS) :</strong> La recherche
          montre une pertinence clinique croissante pour mesurer les changements synaptiques,
          fonctionnels et structurels impliqués dans la neuroplasticité.
        </p>
        <p>
          <strong>Interventions Basées sur la Pleine Conscience :</strong> Des études ont rapporté
          une connectivité accrue après une thérapie basée sur la pleine conscience chez les
          vétérans de combat atteints de TSPT.
        </p>
        <p>
          <strong>Psychothérapie :</strong> La neuroplasticité peut être le mécanisme biologique
          par lequel les interventions psychosociales exercent leurs effets thérapeutiques.
        </p>

        <h2>La Plus Grande Étude Mondiale sur le Traumatisme Infantile</h2>
        <p>
          En février 2024, les chercheurs ont publié les résultats de ce qui a été appelé la plus
          grande étude mondiale sur le traumatisme infantile, révélant des informations importantes
          sur le recâblage cérébral suite à l'adversité précoce.
        </p>

        <h2>Implications pour la Récupération</h2>
        <p>
          La science de la neuroplasticité porte un message profondément porteur d'espoir : le
          cerveau modifié par le traumatisme peut aussi être modifié par des expériences de guérison.
        </p>
        <ul>
          <li><strong>Répétition :</strong> Les nouvelles voies neuronales se renforcent avec l'utilisation répétée</li>
          <li><strong>Intensité :</strong> Une pratique concentrée favorise un recâblage plus rapide</li>
          <li><strong>Spécificité :</strong> Les interventions ciblées traitent des circuits spécifiques</li>
          <li><strong>Pertinence :</strong> Les expériences émotionnellement significatives entraînent un changement durable</li>
        </ul>

        <h2>Conclusion</h2>
        <p>
          La compréhension émergente de la neuroplasticité dans le traitement du traumatisme
          représente un changement de paradigme. Plutôt que de considérer les effets du traumatisme
          comme des dommages permanents, nous comprenons maintenant qu'ils sont des adaptations
          qui peuvent être remodelées.
        </p>

        <div className="sources">
          <h3>Sources</h3>
          <ul>
            <li><a href="https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2023.1103718/full" target="_blank" rel="noopener noreferrer">The Neuroplastic Narrative - Frontiers in Psychiatry (2023)</a></li>
            <li><a href="https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2025.1523035/full" target="_blank" rel="noopener noreferrer">Neural correlates and plasticity of emotion regulation - Frontiers in Behavioral Neuroscience (2025)</a></li>
            <li><a href="https://pubmed.ncbi.nlm.nih.gov/38040046/" target="_blank" rel="noopener noreferrer">rTMS-Induced Neuroplasticity in Psychiatric Disorders - PubMed (2024)</a></li>
            <li><a href="https://www.oxjournal.org/childhood-and-trauma-a-neuroscience-perspective/" target="_blank" rel="noopener noreferrer">Childhood and Trauma: A Neuroscience Perspective - OxJournal</a></li>
          </ul>
        </div>
      </>
    ),
  },
];

export default function BlogPage() {
  const { language } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const currentArticle = selectedArticle
    ? articles.find(a => a.id === selectedArticle)
    : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream-50)' }}>
      <Header />

      {selectedArticle && currentArticle ? (
        /* Article View */
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <button
            onClick={() => setSelectedArticle(null)}
            className="mb-8 text-sm flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--matcha-600)' }}
          >
            <span>&larr;</span>
            {language === 'en' ? 'Back to all articles' : 'Retour aux articles'}
          </button>

          <article className="blog-article">
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'var(--matcha-100)',
                    color: 'var(--matcha-700)'
                  }}
                >
                  {currentArticle.category}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {currentArticle.readTime} min read
                </span>
              </div>
              <h1
                className="text-3xl md:text-4xl mb-4"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--text-primary)',
                  lineHeight: 1.3
                }}
              >
                {language === 'en' ? currentArticle.titleEn : currentArticle.titleFr}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {new Date(currentArticle.date).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </header>

            <div
              className="prose max-w-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              <style jsx global>{`
                .blog-article .prose h2 {
                  font-family: var(--font-dm-serif), Georgia, serif;
                  color: var(--text-primary);
                  font-size: 1.5rem;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .blog-article .prose h3 {
                  font-family: var(--font-dm-serif), Georgia, serif;
                  color: var(--text-primary);
                  font-size: 1.25rem;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .blog-article .prose p {
                  line-height: 1.8;
                  margin-bottom: 1.25rem;
                }
                .blog-article .prose p.lead {
                  font-size: 1.125rem;
                  color: var(--text-primary);
                  border-left: 3px solid var(--matcha-400);
                  padding-left: 1rem;
                  margin-bottom: 2rem;
                }
                .blog-article .prose ul {
                  margin: 1rem 0 1.5rem;
                  padding-left: 1.5rem;
                }
                .blog-article .prose li {
                  margin-bottom: 0.5rem;
                  line-height: 1.7;
                }
                .blog-article .prose strong {
                  color: var(--text-primary);
                }
                .blog-article .prose em {
                  font-style: italic;
                }
                .blog-article .prose a {
                  color: var(--matcha-600);
                  text-decoration: underline;
                  text-underline-offset: 2px;
                }
                .blog-article .prose a:hover {
                  color: var(--matcha-700);
                }
                .blog-article .sources {
                  margin-top: 3rem;
                  padding-top: 2rem;
                  border-top: 1px solid var(--border-soft);
                }
                .blog-article .sources h3 {
                  font-family: var(--font-dm-serif), Georgia, serif;
                  color: var(--text-primary);
                  font-size: 1.125rem;
                  margin-bottom: 1rem;
                }
                .blog-article .sources ul {
                  list-style: none;
                  padding: 0;
                }
                .blog-article .sources li {
                  margin-bottom: 0.75rem;
                  padding-left: 1rem;
                  border-left: 2px solid var(--matcha-200);
                }
                .blog-article .sources a {
                  color: var(--matcha-600);
                  font-size: 0.875rem;
                  text-decoration: none;
                }
                .blog-article .sources a:hover {
                  text-decoration: underline;
                }
              `}</style>
              {language === 'en' ? currentArticle.contentEn : currentArticle.contentFr}
            </div>
          </article>
        </main>
      ) : (
        /* Blog Listing */
        <>
          {/* Hero Section */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto text-center">
              <h1
                className="text-4xl md:text-5xl mb-4"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--text-primary)'
                }}
              >
                {language === 'en' ? 'Research & Insights' : 'Recherche & Perspectives'}
              </h1>
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: 'var(--text-secondary)' }}
              >
                {language === 'en'
                  ? 'Evidence-based articles on mental health, trauma treatment, and the science of healing.'
                  : 'Articles fondés sur des preuves concernant la santé mentale, le traitement du traumatisme et la science de la guérison.'}
              </p>
            </div>
          </section>

          {/* Articles Grid */}
          <section className="pb-20 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => setSelectedArticle(article.id)}
                    className="rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: 'var(--matcha-100)',
                          color: 'var(--matcha-700)'
                        }}
                      >
                        {article.category}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {article.readTime} min
                      </span>
                    </div>
                    <h2
                      className="text-xl mb-3"
                      style={{
                        fontFamily: 'var(--font-dm-serif), Georgia, serif',
                        color: 'var(--text-primary)',
                        lineHeight: 1.3
                      }}
                    >
                      {language === 'en' ? article.titleEn : article.titleFr}
                    </h2>
                    <p
                      className="text-sm mb-4"
                      style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
                    >
                      {language === 'en' ? article.excerptEn : article.excerptFr}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(article.date).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--matcha-600)' }}
                      >
                        {language === 'en' ? 'Read more' : 'Lire la suite'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section
            className="py-16 px-4"
            style={{ background: 'var(--cream-100)' }}
          >
            <div className="max-w-3xl mx-auto text-center">
              <h2
                className="text-2xl md:text-3xl mb-4"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--text-primary)'
                }}
              >
                {language === 'en'
                  ? 'Experience Evidence-Based Healing'
                  : 'Découvrez la Guérison Fondée sur les Preuves'}
              </h2>
              <p
                className="mb-8"
                style={{ color: 'var(--text-secondary)' }}
              >
                {language === 'en'
                  ? 'Matcha combines proven techniques like EMDR and Flash to support your mental wellness journey.'
                  : 'Matcha combine des techniques éprouvées comme l\'EMDR et Flash pour soutenir votre parcours de bien-être mental.'}
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-medium transition-all"
                style={{
                  background: 'var(--matcha-500)',
                  color: 'white',
                }}
              >
                {language === 'en' ? 'Get Started Free' : 'Commencer Gratuitement'}
              </Link>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer
        className="py-12 px-4 border-t"
        style={{
          background: 'var(--cream-50)',
          borderColor: 'var(--border-soft)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p
                className="text-xl font-semibold mb-1"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--matcha-600)',
                }}
              >
                Matcha
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {language === 'en'
                  ? 'Your companion for mental wellness'
                  : 'Votre compagnon pour le bien-être mental'}
              </p>
            </div>
            <div className="flex gap-8">
              <Link
                href="/"
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                {language === 'en' ? 'Home' : 'Accueil'}
              </Link>
              <Link
                href="/pricing"
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                {language === 'en' ? 'Pricing' : 'Tarifs'}
              </Link>
              <Link
                href="/login"
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                {language === 'en' ? 'Login' : 'Connexion'}
              </Link>
            </div>
          </div>
          <div
            className="mt-8 pt-8 border-t text-center text-sm"
            style={{
              borderColor: 'var(--border-soft)',
              color: 'var(--text-muted)',
            }}
          >
            © 2024 Matcha. {language === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}
          </div>
        </div>
      </footer>
    </div>
  );
}
