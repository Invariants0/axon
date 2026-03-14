terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_project" "axon" {
  name        = var.project_name
  description = "AXON - Self-evolving AI agent platform"
  environment = "Development"
}
