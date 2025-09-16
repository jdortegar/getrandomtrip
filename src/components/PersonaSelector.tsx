import React from 'react';
import { personas, Persona } from '@/constants/personas';
import styles from './PersonaSelector.module.css';
import Image from 'next/image';

interface PersonaSelectorProps {
  onSelectPersona: (personaId: string) => void;
  currentPersonaId: string;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ onSelectPersona, currentPersonaId }) => {
  return (
    <div className={styles.selectorContainer}>
      <h3 className={styles.title}>Elige tu Guía de Viaje</h3>
      <div className={styles.cardsWrapper}>
        {personas.map((persona) => (
          <div 
            key={persona.id}
            className={`${styles.card} ${persona.id === currentPersonaId ? styles.selected : ''}`}
            onClick={() => onSelectPersona(persona.id)}
          >
            <div className={styles.avatarContainer}>
              <Image 
                src={persona.avatar}
                alt={persona.name}
                width={80}
                height={80}
                className={styles.avatar}
              />
            </div>
            <div className={styles.infoContainer}>
              <h4 className={styles.name}>{persona.name}</h4>
              <p className={styles.bio}>{persona.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonaSelector;
