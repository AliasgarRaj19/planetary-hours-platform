import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  type AppDistribution,
  type AppDistributionMode,
  getAndroidDistribution,
  updateAndroidDistribution,
  uploadAndroidApk,
} from '../api/app-distribution'

export function SettingsPage() {
  const [distribution, setDistribution] = useState<AppDistribution | null>(null)
  const [activeMode, setActiveMode] = useState<AppDistributionMode>('direct_apk')
  const [isEnabled, setIsEnabled] = useState(true)
  const [storeUrl, setStoreUrl] = useState('')
  const [apkFile, setApkFile] = useState<File | null>(null)
  const [versionName, setVersionName] = useState('')
  const [versionCode, setVersionCode] = useState('')
  const [status, setStatus] = useState('Loading app distribution settings...')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    let isMounted = true

    getAndroidDistribution()
      .then((nextDistribution) => {
        if (!isMounted) {
          return
        }

        setDistribution(nextDistribution)
        setActiveMode(nextDistribution.activeMode)
        setIsEnabled(nextDistribution.isEnabled)
        setStoreUrl(nextDistribution.storeUrl ?? '')
        setStatus('')
      })
      .catch((nextError: unknown) => {
        if (!isMounted) {
          return
        }

        setError(toErrorMessage(nextError))
        setStatus('')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const currentArtifact = distribution?.artifact
  const uploadStatus = useMemo(() => {
    if (!currentArtifact) {
      return 'No uploaded APK metadata is available yet.'
    }

    const details = [
      currentArtifact.versionName ? `Version ${currentArtifact.versionName}` : null,
      currentArtifact.versionCode ? `Build ${currentArtifact.versionCode}` : null,
      formatBytes(currentArtifact.sizeBytes),
    ].filter(Boolean)

    return details.join(' · ')
  }, [currentArtifact])

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setStatus('')

    if (activeMode === 'google_play' && !storeUrl.trim()) {
      setError('Play Store URL is required for Google Play mode.')
      return
    }

    setIsSaving(true)

    try {
      const nextDistribution = await updateAndroidDistribution({
        activeMode,
        isEnabled,
        storeUrl: storeUrl.trim() || null,
      })
      setDistribution(nextDistribution)
      setStatus('App distribution settings saved.')
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setStatus('')

    if (!apkFile) {
      setError('Choose an APK file before uploading.')
      return
    }

    setIsUploading(true)

    try {
      const result = await uploadAndroidApk({
        file: apkFile,
        versionName,
        versionCode,
      })
      setDistribution(result.distribution)
      setActiveMode(result.distribution.activeMode)
      setStatus('APK uploaded and Direct APK mode is active.')
      setApkFile(null)
      setVersionName('')
      setVersionCode('')
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setApkFile(event.target.files?.[0] ?? null)
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="section-kicker">Platform configuration</p>
        <h2>Settings</h2>
        <p>Control how visitors download or open the Android app from the public website.</p>
      </div>

      {status ? <p className="editor-message">{status}</p> : null}
      {error ? <p className="editor-message error">{error}</p> : null}

      <div className="settings-grid">
        <form className="settings-panel" onSubmit={handleSettingsSubmit}>
          <div>
            <p className="card-label">App Distribution</p>
            <h3>Active Android destination</h3>
            <p>Only one destination is active for the public Download App action.</p>
          </div>

          <fieldset className="mode-options">
            <legend>Active Distribution Mode</legend>
            <label>
              <input
                checked={activeMode === 'direct_apk'}
                name="activeMode"
                onChange={() => setActiveMode('direct_apk')}
                type="radio"
                value="direct_apk"
              />
              Direct APK
            </label>
            <label>
              <input
                checked={activeMode === 'google_play'}
                name="activeMode"
                onChange={() => setActiveMode('google_play')}
                type="radio"
                value="google_play"
              />
              Google Play
            </label>
          </fieldset>

          <label className="settings-field">
            Play Store URL
            <input
              onChange={(event) => setStoreUrl(event.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=com.planetaryhours.app"
              type="url"
              value={storeUrl}
            />
          </label>

          <label className="checkbox-field">
            <input
              checked={isEnabled}
              onChange={(event) => setIsEnabled(event.target.checked)}
              type="checkbox"
            />
            Enable public app distribution
          </label>

          <button disabled={isSaving || Boolean(status)} type="submit">
            {isSaving ? 'Saving...' : 'Save Distribution Settings'}
          </button>
        </form>

        <form className="settings-panel" onSubmit={handleUploadSubmit}>
          <div>
            <p className="card-label">Direct APK</p>
            <h3>Upload replacement APK</h3>
            <p>{uploadStatus}</p>
          </div>

          {currentArtifact ? (
            <dl className="artifact-details">
              <div>
                <dt>Current file</dt>
                <dd>{currentArtifact.fileName}</dd>
              </div>
              <div>
                <dt>SHA-256</dt>
                <dd>{currentArtifact.checksumSha256 || 'Not available for legacy APK'}</dd>
              </div>
            </dl>
          ) : null}

          <label className="settings-field">
            APK file
            <input accept=".apk" onChange={handleFileChange} type="file" />
          </label>

          <div className="settings-inline-fields">
            <label className="settings-field">
              Version name
              <input
                onChange={(event) => setVersionName(event.target.value)}
                placeholder="1.0.4"
                value={versionName}
              />
            </label>
            <label className="settings-field">
              Version code
              <input
                min="1"
                onChange={(event) => setVersionCode(event.target.value)}
                placeholder="7"
                type="number"
                value={versionCode}
              />
            </label>
          </div>

          <button disabled={isUploading || Boolean(status)} type="submit">
            {isUploading ? 'Uploading...' : 'Upload APK'}
          </button>
        </form>
      </div>
    </section>
  )
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to update app distribution.'
}

function formatBytes(value: number) {
  if (!value) {
    return 'Legacy file size unavailable'
  }

  const megabytes = value / (1024 * 1024)
  return `${megabytes.toFixed(1)} MB`
}
