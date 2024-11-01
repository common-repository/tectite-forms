<div id="TectiteAdmin">
	<h1>Tectite Forms</h1>
    <h2>Benefits</h2>
    <ul>
        <li><b>Choice</b> - get an instant contact, feedback, or inquiry form or easily design your own form.</li>
        <li><b>Security</b> - avoid security problems associated with processing forms on your server.</li>
        <li><b>Intelligent anti-spam processing</b> - using Tectite FormMail provides you with over a
            decade of experience in preventing form spam.</li>
        <li><b>Zero install</b> - no script to install.  Your form submits to our script on our server.</li>
		<li><b>AJAX</b> - modern form submission, no page refresh and your visitors never leave your website.</li>
        <li><b>Storage</b> - we store form submissions so you won't lose valuable contacts due to a spam filter.</li>
        <li><b>Reports</b> - get a daily report about the activity on your form.</li>
		<li><b>Multiple use</b> - use the same form on multiple sites without copying. Any changes you make are automatically updated on all sites.</li>
    </ul>

    <h2>Start now...</h2>
    <p>
        Install your working form on your WordPress site with this simple 3 step process:
    </p>
    <ol>
        <li>create your <a href="https://www.tectite.com/hf/auth/Create?use=wp">free account</a>;</li>
        <li>choose a free working sample form (or design your own);</li>
        <li>paste your unique form code into your WordPress site.</li>
    </ol>
    <h2>Options</h2>

	<p>
		<a href="https://www.tectite.com/hf/auth/Plans">Check what you'll get with our completely free plan, and what's available
		on our other plans</a>.
	</p>

	<p>
		We don't ask you for donations, but we would really appreciate it if you'd
		include a link to us via an attractive &quot;Powered by FormMail&quot; button.  It's automatic,
		just click the box below to enable the button!
	</p>

	<p style="width:50%;text-align:right;">
		<img src="https://www.tectite.com/images/FormMail_rnd_blue.png" alt="contact form" title="Tectite FormMail" border="0" />
	</p>

	<p>
		In return for choosing to display a button, we'll give you these extra benefits (for free accounts):
	</p>
	<ul>
		<li>extra days of form submission storage (a total of 7 days).</li>
		<li>use of our simple form tester to make testing your forms easy.</li>
    </ul>
	<form id="TectiteOptions" method="POST">
		<p>
			<b>To get these benefits, simply check the box below:</b>
		</p>
		<p>
			<?php
			if ( get_option ( 'tectite_forms_button' ) === 'y' )
				$sButtonChecked = 'checked="checked"';
			else
				$sButtonChecked = '';
			?> 
			<input type="checkbox" name="tectite_forms_button" value="y" <?php echo $sButtonChecked; ?> />&#160;<b>YES! Please give me these benefits
				and display the &quot;Powered by FormMail&quot; button on my form.</b>
		</p>
		<input type="hidden" name="tectite_forms_submitted" value="1" />
	</form>

    <h2>FAQ</h2>
    <dl>
        <dt>I use Akismet, that handles spam for me, right?</dt>
        <dd>Unfortunately, no! On WordPress, Akismet handles <i>comment</i> spam but not email or form spam.
            When you have a form on your website, spammers will try to send you spam via your form.
            This is completely different to WordPress comment spam.
        </dd>
        <dt>Why can't I use a basic contact form plugin on my WordPress site?</dt>
		<dd>
			WordPress can send you email already, so a basic contact form plugin seems like a great idea.
			But a basic contact form plugin cannot protect you from form spam, even with CAPTCHA (and
			everybody <i>hates</i> CAPTCHA).
			<br />
			Also, what if your email spam filter throws away a valuable contact?
			Our service records all form submissions for you, so you can check daily
			for anything your email has missed.
		</dd>
		<dt>Why doesn't CAPTCHA work?</dt>
		<dd>
			Spammers are now using people to solve CAPTCHA puzzles and send spam.
			Also, computers are getting smarted at automatically solving CAPTCHA.
		</dd>
		<dt>Why do I need to sign up for a form service?</dt>
		<dd>
			Many reasons, here's a few:
            <ol>
                <li>Easy installation - no scripts to install or HTML to copy-and-paste.</li>
                <li>Our service learns about spam and gets better at blocking it.</li>
                <li>You can get daily reports.</li>
				<li>A single form can be used on multiple sites without copying. Your changes are automatically updated on all sites.</li>
            </ol>
            <i>Remember</i>: <b>it's free!</b>
		</dd>
		<dt>I've chosen to display the FormMail button, how do I use the form tester?</dt>
        <dd>
            Once you've installed your form on your WordPress page, open that
			page in your browser, then change the URL in the browser address bar.
			<br />
			If there is no ? shown in the URL, just add <code>?formtest=1</code>
			to the end.
			<br />
			If there is a ? shown in the URL, just add <code>&amp;formtest=1</code>
			to the end.
			<br />
			Examples:
			<br />
			<table>
				<tr>
					<td><code>http://www.mydomain.com/wordpress</code></td>
					<td><b>becomes</b></td>
					<td><code>http://www.mydomain.com/wordpress?formtest=1</code></td>
				</tr>
				<tr>
					<td><code>http://www.mydomain.com/wordpress/?page=myhome</code></td>
					<td><b>becomes</b></td>
					<td><code>http://www.mydomain.com/wordpress/?page=myhome&amp;formtest=1</code></td>
				</tr>
			</table>
		</dd>
	</dl>
	<h2>About Tectite</h2>
	<p>
		Since 2002, <a href = "https://www.tectite.com/">www.tectite.com</a> has
		produced the
		world's leading secure anti-spam
        PHP Form Processing script, called &quot;FormMail&quot;.
    </p>
    <p>
        Tectite <a href="https://www.tectite.com/formmailpage.php">FormMail</a> has been
		downloaded about 500,000 times and is trusted
        by expert webmasters around the world.
    </p>
</div>