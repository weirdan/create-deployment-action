import * as core from '@actions/core'
import * as github from "@actions/github"

const boolOpt = (val: string): boolean => {
  if (val === "true") {
    return true
  }
  if (val === "false") {
    return false
  }
  throw new Error(`Unexpected boolean value: ${val}`)
}

async function run(): Promise<void> {
  try {
    const context = github.context

    const token = core.getInput("token", {required: true})
    const ref = core.getInput("ref", {required: false}) || context.ref
    const task = core.getInput("task", {required: false}) || "deploy"
    const auto_merge = boolOpt(core.getInput("auto_merge", {required: false}) || "true")
    const payload = core.getInput("payload", {required: false}) || ""
    const environment = core.getInput("environment", {required: false}) || "production"
    const description = core.getInput("description", {required: false}) || ""
    const transient_environment = boolOpt(core.getInput("transient_environment", {required: false}) || "false")
    const production_environment = boolOpt(core.getInput("production_environment", {required: false}) || "false")

    const client = new github.GitHub(token, {previews: ["flash", "ant-man"]})

    const deployment = await client.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref,
      task,
      auto_merge,
      payload,
      environment,
      description,
      transient_environment,
      production_environment
    })

    core.setOutput("deployment_id", deployment.data.id.toString())

  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
