import React from 'react';
import { Link } from 'react-router-dom';
import { profile, projects } from '../data';

const Home = () => {
    return (
        <div className="home-page animate-fade-in">
            {/* SWISS STYLE HERO */}
            <section className="hero-swiss">
                <div className="container">
                    <div className="swiss-header">
                        <h1 className="swiss-title">JACOB MOHAN</h1>
                    </div>

                    <div className="swiss-separator"></div>

                    <div className="swiss-grid">
                        <div className="swiss-col">
                            <span className="swiss-label">Role</span>
                            <span className="swiss-value">{profile.title}</span>
                        </div>
                        <div className="swiss-col">
                            <span className="swiss-label">Specialization</span>
                            <span className="swiss-value">LLM Systems & Fintech</span>
                        </div>
                        <div className="swiss-col">
                            <span className="swiss-label">Contact</span>
                            <span className="swiss-value">{profile.phone}</span>
                            <a href={`mailto:${profile.email}`} className="swiss-link">{profile.email}</a>
                            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="swiss-link" style={{ marginTop: '4px', fontSize: '0.9rem' }}>GitHub Profile</a>
                        </div>
                    </div>

                    <div className="swiss-bio-section">
                        <p className="swiss-bio">{profile.about}</p>

                        <div className="swiss-tech-cloud">
                            {profile.skills.map(skill => (
                                <span key={skill} className="swiss-tech-tag">{skill}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* PROJECTS LIST */}
            <section className="projects-section container">
                <div className="section-header">
                    <span className="section-label">Selected Works</span>
                    <span className="section-count">({projects.length})</span>
                </div>

                <div className="projects-list">
                    {projects.map((project) => (
                        <Link to={`/project/${project.id}`} key={project.id} className="project-row">
                            <div className="project-image-wrapper">
                                <img src={project.thumbnail} alt={project.title} className="project-thumb" loading="lazy" />
                            </div>
                            <div className="project-meta">
                                <span className="project-category">{project.category}</span>
                                <h2 className="project-title">{project.title}</h2>
                                <p className="project-desc">{project.description}</p>
                            </div>
                            <div className="project-arrow">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <footer className="footer container">
                <div className="footer-content">
                    <p className="footer-text">&copy; {new Date().getFullYear()} Jacob Mohan. Built with React & Vite.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
