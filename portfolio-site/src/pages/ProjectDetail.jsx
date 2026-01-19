import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom'; // IMPORT PORTAL
import { projects } from '../data';

const Modal = ({ content, title, onClose }) => {
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <h3 className="modal-title">{title}</h3>
                <div className="modal-body">
                    <pre className="modal-text">{content}</pre>
                </div>
            </div>
        </div>,
        document.body // RENDER DIRECTLY TO BODY
    );
};

const ProjectDetail = () => {
    const { id } = useParams();
    const project = projects.find(p => p.id === id);
    const [modalContent, setModalContent] = useState(null);

    if (!project) return <div className="container" style={{ paddingTop: '100px' }}>Project not found</div>;

    const openModal = (content, title) => {
        if (content) {
            setModalContent({ text: content, title: title });
        }
    };

    const closeModal = () => {
        setModalContent(null);
    };

    return (
        <div className="project-page animate-fade-in">
            {/* Modal using Portal */}
            {modalContent && (
                <Modal
                    content={modalContent.text}
                    title={modalContent.title}
                    onClose={closeModal}
                />
            )}

            <nav className="project-nav container">
                <Link to="/" className="back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    <span style={{ marginLeft: '4px' }}>Back</span>
                </Link>
            </nav>

            <header className="project-header container">
                <div className="header-meta">
                    <span className="project-category-badge">{project.category}</span>
                </div>
                <h1 className="project-headline">{project.title}</h1>
                <div className="project-story">
                    <p>{project.details.story}</p>
                </div>

                <div className="tech-stack-list">
                    <span className="tech-label">Technologies:</span>
                    {project.details.tech.map(t => <span key={t} className="tech-item">{t}</span>)}
                </div>
            </header>

            <div className="project-content container">
                {project.details.gallery.map((item, index) => {
                    const alignClass = item.align ? `align-${item.align}` : (index % 2 === 0 ? 'align-left' : 'align-right');

                    return (
                        <div key={index} className={`gallery-block ${alignClass}`}>

                            <div className="gallery-visual" onClick={() => item.visualContent && openModal(item.visualContent, `Viewing ${item.type} Content`)}>
                                {item.visualType === 'text-card' ? (
                                    <div className="text-card-preview">
                                        <div className="text-card-content">
                                            {item.visualContent ? item.visualContent : "No content available."}
                                        </div>
                                        <div className="text-card-overlay">
                                            <span className="text-card-badge">Click to Expand</span>
                                        </div>
                                    </div>
                                ) : item.image ? (
                                    <div className="image-wrapper-clickable">
                                        <img src={item.image} alt={item.type} loading="lazy" />
                                        {item.visualContent && (
                                            <div className="image-overlay-hint">View Details</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="placeholder-visual">No Image Available</div>
                                )}
                            </div>

                            <div className="gallery-text">
                                <span className="step-type">{item.type.toUpperCase()}</span>

                                {item.title && <h3>{item.title}</h3>}

                                <p>{item.text}</p>

                                <div className="text-actions">
                                    {item.textContent && (
                                        <button className="read-more-btn" onClick={() => openModal(item.textContent, `Full Prompt: ${item.title || item.type}`)}>
                                            Read Full Prompt
                                        </button>
                                    )}

                                    {item.visualType === 'text-card' && (
                                        <button className="read-more-btn" onClick={() => openModal(item.visualContent, `Full Model Response`)}>
                                            Read Full Response
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <footer className="project-footer container">
                <Link to="/" className="back-home-btn">View All Projects</Link>
            </footer>
        </div>
    );
};

export default ProjectDetail;
