import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

const noop = () => {}

test('the dialog is described by its message, so screen readers announce the question', () => {
  const markup = renderToStaticMarkup(
    <ConfirmDialog open={false} message="Delete everyone?" confirmLabel="Delete" onConfirm={noop} onCancel={noop} />,
  )

  const describedBy = markup.match(/<dialog[^>]*\saria-describedby="([^"]+)"/)?.[1]
  expect(describedBy).toBeTruthy()
  expect(markup).toMatch(new RegExp(`<p[^>]*\\sid="${describedBy}"[^>]*>Delete everyone\\?</p>`))
})
