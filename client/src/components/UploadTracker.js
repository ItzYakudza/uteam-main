import React from 'react';
import { useUploadStore } from '../store/uploadStore';
import './UploadTracker.css';

function UploadTracker() {
    const uploads = useUploadStore((state) => state.uploads);
    const removeUpload = useUploadStore((state) => state.removeUpload);

    // Считаем активные загрузки
    const activeUploads = Object.entries(uploads).filter(
        ([_, upload]) => upload.status === 'uploading'
    );

    if (activeUploads.length === 0) return null;

    return (
        <div className="upload-tracker">
            <div className="upload-tracker-header">
                <h3>Загрузки ({activeUploads.length})</h3>
            </div>
            <div className="upload-tracker-list">
                {activeUploads.map(([uploadId, upload]) => (
                    <div key={uploadId} className="upload-item">
                        <div className="upload-info">
                            <span className="upload-title">{upload.formData?.title || 'Загрузка'}</span>
                            <span className="upload-file">({upload.formData?.gameArchive})</span>
                        </div>
                        <div className="upload-progress-container">
                            <div className="upload-progress-bar">
                                <div 
                                    className="upload-progress-fill"
                                    style={{ width: `${upload.progress}%` }}
                                ></div>
                            </div>
                            <span className="upload-progress-text">{upload.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UploadTracker;
