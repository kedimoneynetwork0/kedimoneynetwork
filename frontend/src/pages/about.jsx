import React from 'react';
import HeroSection from '../components/HeroSection';
import Header from '../components/Header';

export default function About() {
  return (
    <div>
      <Header />
      <HeroSection />
      <div style={styles.container}>
        <h1 style={styles.title}>Kedi Money Network</h1>
        <p style={styles.text}>
          Kedi Money Network ni platform itanga uburyo bworoshye kandi bwizewe bwo guhererekanya amafaranga, 
          gukurikirana imishinga, no gufasha abakoresha kubona amahirwe yo kwinjira mu isoko ry’imari.
        </p>
        <p style={styles.text}>
          Intego yacu ni ugufasha abantu bose kugera ku bukungu burambye binyuze mu ikoranabuhanga rigezweho.
        </p>
        <p style={styles.text}>
          Twiyemeje gutanga serivisi nziza, zizewe kandi zorohereza abakiriya bacu mu buryo bwihuse kandi butekanye.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: '#e6f2f2', // icyatsi cyoroshye
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    color: '#004d40', // icyatsi cya kera gikomeye
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    lineHeight: '1.6',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '20px',
    borderBottom: '3px solid #00796b',
    paddingBottom: '10px',
  },
  text: {
    fontSize: '1.2rem',
    marginBottom: '15px',
  },
};
