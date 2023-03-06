import * as core from '@actions/core'
import * as github from '@actions/github'

const boolOpt = (val: string): boolean => {
  if (val === 'true') {
    return true
  }
  if (val === 'false') {
    return false
  }
  throw new Error(`Unexpected boolean value: ${val}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isArrayOfStrings = (value: any): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string')

const jsonList = (val: string): string[] => {
  try {
    const ret = JSON.parse(val)
    if (!isArrayOfStrings(ret)) {
      throw new Error(`Unexpected JSON value: ${val}`)
    }
    return ret
  } catch {
    throw new Error(`Unexpected JSON value: ${val}`)
  }
}

const refOpt = (val: string): string => val.replace(/^refs\/heads\//, '')

async function run(): Promise<void> {
  try {
    const context = github.context

    const token = core.getInput('token', {required: true})
    const ref = refOpt(core.getInput('ref', {required: false}) || context.ref)
    const task = core.getInput('task', {required: false}) || 'deploy'
    const autoMerge = boolOpt(
      core.getInput('auto_merge', {required: false}) || 'true'
    )
    const payload = core.getInput('payload', {required: false}) || ''
    const environment =
      core.getInput('environment', {required: false}) || 'production'
    const description = core.getInput('description', {required: false}) || ''
    const transientEnvironment = boolOpt(
      core.getInput('transient_environment', {required: false}) || 'false'
    )
    const productionEnvironment = boolOpt(
      core.getInput('production_environment', {required: false}) || 'false'
    )
    const requiredContexts = jsonList(
      core.getInput('required_contexts', {required: false}) || '[]'
    )

    const client = github.getOctokit(token, {previews: ['flash', 'ant-man']})

    const request = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref,
      task,
      auto_merge: autoMerge,
      payload,
      environment,
      description,
      transient_environment: transientEnvironment,
      production_environment: productionEnvironment,
      required_contexts: requiredContexts
    }

    core.info('Creating deployment...')
    core.debug(`Deployment params: ${JSON.stringify(request)}`)

    const deployment = await client.repos.createDeployment(request)
    if ('message' in deployment.data) {
      core.error(`Failed to create deployment: ${deployment.data.message}`)
      core.setFailed(deployment.data.message)
    } else {
      core.info(
        `Successfully created deployment: ${deployment.data.id.toString()}`
      )
      core.setOutput('deployment_id', deployment.data.id.toString())
    }
  } catch (error) {
    const e: Error = error as Error
    core.error(e)
    core.setFailed(e.message)
  }
}

run()
