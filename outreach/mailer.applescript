-- aiTA outreach mailer — drives Mail.app. No API key, uses the account already configured on this Mac.
-- usage: osascript mailer.applescript <mode> <to> <sender> <subject> <bodyFilePath>
--   mode   = "draft" (save to Drafts; reversible; default) | "send" (actually send; approval-gated)
--   sender = "" to use Mail's default account, or "Name <addr>" matching a configured account.
-- Returns "ok:draft" / "ok:send" on success; AppleScript error otherwise (surfaced by the caller).

on run argv
	set theMode to item 1 of argv
	set theTo to item 2 of argv
	set theSender to item 3 of argv
	set theSubject to item 4 of argv
	set bodyFile to item 5 of argv
	set theBody to (read (POSIX file bodyFile) as «class utf8»)

	tell application "Mail"
		set msg to make new outgoing message with properties {subject:theSubject, content:theBody, visible:false}
		tell msg
			make new to recipient at end of to recipients with properties {address:theTo}
			if theSender is not "" then
				try
					set sender to theSender
				end try
			end if
		end tell
		if theMode is "send" then
			send msg
			return "ok:send"
		else
			save msg
			return "ok:draft"
		end if
	end tell
end run
