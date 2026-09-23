export function getErrorMessage(err) {
  const data = err.response?.data
  if (data?.issues?.length) return data.issues.map((issue) => issue.message).join('; ')
  if (data?.error) return data.error
  return err.message
}
