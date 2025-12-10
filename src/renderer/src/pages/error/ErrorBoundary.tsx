import ButtonLink from '@renderer/shared/components/elements/ButtonLink'
import './NotFoundPage.css'

export default function ErrorBoundary() {
  // let error = useRouteError();

  return (
    <div className="page">
      <div className="page__container">
        <div className="page__status">Error</div>
        <div className="page__title">Whoops! Something's changed</div>
        <div className="page__description">
          Sorry, something went wrong or the page you are looking for does not exist. Please check
          the URL or try again later.
        </div>
        <ButtonLink
          href="/"
          variant="solid"
          color="cyan"
          icon={<IIonHome width={16} height={16} />}
        >
          Go home
        </ButtonLink>
      </div>
    </div>
  )
}
