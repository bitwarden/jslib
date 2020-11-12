# How to Contribute

Contributions of all kinds are welcome!

Please visit our [Community Forums](https://community.bitwarden.com/) for general community discussion and the development roadmap.

Here is how you can get involved:

* **Request a new feature:** Go to the [Feature Requests category](https://community.bitwarden.com/c/feature-requests/) of the Community Forums. Please search existing feature requests before making a new one
  
* **Write code for a new feature:** Make a new post in the [Github Contributions category](https://community.bitwarden.com/c/github-contributions/) of the Community Forums. Include a description of your proposed contribution, screeshots, and links to any relevant feature requests. This helps get feedback from the community and Bitwarden team members before you start writing code
  
* **Report a bug or submit a bugfix:** Use Github issues and pull requests
  
* **Write documentation:** Submit a pull request to the [Bitwarden help repository](https://github.com/bitwarden/help)
  
* **Help other users:** Go to the [User-to-User Support category](https://community.bitwarden.com/c/support/) on the Community Forums

## Contributor Agreement

Please sign the [Contributor Agreement](https://cla-assistant.io/bitwarden/jslib) if you intend on contributing to any Github repository. Pull requests cannot be accepted and merged unless the author has signed the Contributor Agreement.

## Pull Request Guidelines

* use `npm run lint` and fix any linting suggestions before submitting a pull request
* commit any pull requests against the `master` branch
* include a link to your Community Forums post

# Setting up your Local Dev environment for jslib
In order to easily test, check and develop against local changes to jslib across each of the TypeScript/JavaScript clients it is recommended to use symlinks for the submodule so that you only have to make the change once and don't need to x-copy or wait for a commit+merge to checkout, pull and test against your other repos.

## Prerequisites
1. git bash or other git command line

## Clone Repos
In order for this to work well, you need to use a consistent relative directory structure. Repos should be cloned in the following way:

* `./<your project(s) directory>`; we'll call this `/dev` ('cause why not)
  * jslib - `git clone https://github.com/bitwarden/jslib.git` (/dev/jslib)
  * web - `git clone --recurse-submodules https://github.com/bitwarden/web.git` (/dev/web)
  * desktop - `git clone --recurse-submodules https://github.com/bitwarden/desktop.git` (/dev/desktop)
  * browser - `git clone --recurse-submodules https://github.com/bitwarden/browser.git` (/dev/browser)
  * cli - `git clone --recurse-submodules https://github.com/bitwarden/cli` (/dev/cli)

You should notice web, desktop, browser and cli each reference jslib as a git submodule. If you've already cloned the repos but didn't use `--recurse-submodules` then you'll need to init those:

`npm run sub:init`

## Configure Symlinks
Be aware that using git clone will make symlinks added to your repo be seen by git as plain text file paths, lets make sure this is set to true to prevent that. In the project root run, `git config core.symlinks true`.

For each project other than jslib, run the following:

For macOS/Linux: `npm run symlink:mac`

For Windows: `npm run symlink:win`

## Updates and Cleanup
* Need to update parent repo that has jslib as a submodule to latest from actual jslib repo?
    * Create branch from master (`git checkout -b update-jslib`)
    * From new local branch: `npm run sub:pull` (`git submodule foreach git pull origin master`)
    * Follow Pull Request notes for commit/push instructions
    * Once merged, pull master, rebase your feature branch and then do npm run sub:update to catch your submodule up
* Discard changes made to a submodule
    * `git submodule foreach git reset —hard`


## Merge Conflicts
At times when you need to perform a `git merge master` into your feature or local branch, and there are conflicting version references to the *jslib* repo from your other clients, you will not be able to use the traditional merge or stage functions you would normally use for a file.

To resolve you must use either `git reset` or update the index directly using `git update-index`. You can use (depending on whether you have symlink'd jslib) one of the following:

```bash
git reset master -- jslib
git reset master@{upstream} -- jslib
git reset HEAD -- jslib
git reset MERGE_HEAD -- jslib
```

Those should automatically stage the change and reset the jslib submodule back to where it needs to be (generally at the latest version from `master`).

The other option is to update the index directly using the plumbing command git update-index. To do that, you need to know that an object of type gitlink (i.e., directory entry in a parent repository that points to a submodule) is 0160000. You can figure it out from `git ls-files -s` or the following reference (see "1110 (gitlink)" under 4-bit object type): https://github.com/gitster/git/blob/master/Documentation/technical/index-format.txt

To use that approach, figure out the hash you want to set the submodule to, then run, e.g.:

`git update-index --cacheinfo 0160000,533da4ea00703f4ad6d5518e1ce81d20261c40c0,jslib`

see: [https://stackoverflow.com/questions/26617838/how-to-resolve-git-submodule-conflict-if-submodule-is-not-initialized](https://stackoverflow.com/questions/26617838/how-to-resolve-git-submodule-conflict-if-submodule-is-not-initialized)
