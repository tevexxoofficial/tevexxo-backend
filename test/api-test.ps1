$ErrorActionPreference = 'Stop'
$BASE = 'http://localhost:5000/api/admin'
$results = @()
function Test($name, $condition, $extra = '') {
  $script:results += [pscustomobject]@{ Name = $name; Pass = [bool]$condition; Info = $extra }
  if ($condition) { Write-Output "PASS | $name $extra" } else { Write-Output "FAIL | $name $extra" }
}

# 1. LOGIN (bad credentials first)
try { Invoke-RestMethod -Method Post "$BASE/auth/login" -ContentType 'application/json' -Body '{"email":"admin@tevexxo.com","password":"wrong"}' | Out-Null; Test 'login rejects wrong password' $false } catch { Test 'login rejects wrong password' ($_.Exception.Response.StatusCode.value__ -eq 401) "(HTTP $($_.Exception.Response.StatusCode.value__))" }

$login = Invoke-RestMethod -Method Post "$BASE/auth/login" -ContentType 'application/json' -Body '{"email":"admin@tevexxo.com","password":"Admin@12345"}'
$H = @{ Authorization = "Bearer $($login.token)" }
Test 'admin login returns token+admin' ($login.token -and $login.data.email -eq 'admin@tevexxo.com')

# 2. Protected route without token must 401
try { Invoke-RestMethod "$BASE/users" | Out-Null; Test 'users requires auth' $false } catch { Test 'users requires auth' ($_.Exception.Response.StatusCode.value__ -eq 401) }

# 3. ME
$me = Invoke-RestMethod "$BASE/auth/me" -Headers $H
Test 'GET /auth/me' ($me.data.id -eq $login.data.id)

# 4. DASHBOARD
$dash = Invoke-RestMethod "$BASE/dashboard" -Headers $H
Test 'dashboard stats from DB' ($dash.data.stats.totalUsers -ge 6 -and $dash.data.stats.activeCourses -ge 5) "(users=$($dash.data.stats.totalUsers), revenue=$($dash.data.stats.totalRevenueLabel))"
Test 'dashboard topCourses real data' ($dash.data.topCourses.Count -gt 0 -and $dash.data.topCourses[0].name)
Test 'dashboard recent lists' ($dash.data.recentEnrollments.Count -gt 0)

# 5. USERS CRUD
$u = Invoke-RestMethod -Method Post "$BASE/users" -Headers $H -ContentType 'application/json' -Body '{"name":"Test Learner","email":"testlearner@example.com","role":"Learner","status":"Active","detail":"QA Course"}'
$uid = $u.data.id
Test 'CREATE user' ([bool]$uid)
$dup = $null; try { Invoke-RestMethod -Method Post "$BASE/users" -Headers $H -ContentType 'application/json' -Body '{"name":"Dup","email":"testlearner@example.com"}' } catch { $dup = $_ }
Test 'duplicate user email rejected (409)' ($dup -and $dup.Exception.Response.StatusCode.value__ -eq 409)
$up = Invoke-RestMethod -Method Put "$BASE/users/$uid" -Headers $H -ContentType 'application/json' -Body '{"status":"Inactive","detail":"Updated by QA"}'
Test 'UPDATE user' ($up.data.status -eq 'Inactive')
$list = Invoke-RestMethod "$BASE/users" -Headers $H
Test 'LIST users contains updated row' (($list.data | Where-Object { $_.id -eq $uid }).detail -eq 'Updated by QA')

# 6. COURSES CRUD
$c = Invoke-RestMethod -Method Post "$BASE/courses" -Headers $H -ContentType 'application/json' -Body '{"name":"QA Testing Course","category":"Testing","status":"Draft","amount":"INR 5000","price":5000,"studentsCount":10}'
$cid = $c.data.id
Test 'CREATE course' ([bool]$cid)
$cup = Invoke-RestMethod -Method Put "$BASE/courses/$cid" -Headers $H -ContentType 'application/json' -Body '{"price":18000,"amount":"INR 18000"}'
Test 'UPDATE course price' ($cup.data.price -eq 18000 -and $cup.data.amount -eq 'INR 18000')
$statsAfter = Invoke-RestMethod "$BASE/dashboard/stats" -Headers $H
Test 'dashboard revenue computed from orders' ($statsAfter.data.totalRevenue -gt 0)

# 7. Validation errors
try { Invoke-RestMethod -Method Post "$BASE/courses" -Headers $H -ContentType 'application/json' -Body '{"category":"x"}' | Out-Null; Test 'course without name rejected' $false } catch { Test 'course without name rejected (400)' ($_.Exception.Response.StatusCode.value__ -eq 400) }

# 8. Other entities quick create
$p = Invoke-RestMethod -Method Post "$BASE/programs" -Headers $H -ContentType 'application/json' -Body '{"name":"QA Program","category":"6 Courses","status":"Active"}'
Test 'CREATE program' ([bool]$p.data.id)
$pr = Invoke-RestMethod -Method Post "$BASE/projects" -Headers $H -ContentType 'application/json' -Body '{"name":"QA Project","category":"Web Development","status":"Published"}'
Test 'CREATE project' ([bool]$pr.data.id)
$i = Invoke-RestMethod -Method Post "$BASE/inquiries" -Headers $H -ContentType 'application/json' -Body '{"name":"QA Contact","email":"qa@example.com","category":"General Inquiry","message":"Hello"}'
Test 'CREATE inquiry/contact' ([bool]$i.data.id)
$o = Invoke-RestMethod -Method Post "$BASE/orders" -Headers $H -ContentType 'application/json' -Body '{"name":"#TX99999","category":"QA User","amount":"1234","status":"Paid","detail":"UPI"}'
Test 'CREATE order' ([bool]$o.data.id)

# 9. AUDIT LOGS captured everything
$logs = Invoke-RestMethod "$BASE/audit-logs?limit=200" -Headers $H
Test 'audit logs exist for CREATE/UPDATE' ($logs.total -ge 8) "(total=$($logs.total))"
$courseUpdateLog = $logs.data | Where-Object { $_.entity -eq 'COURSE' -and $_.action -eq 'UPDATE' } | Select-Object -First 1
Test 'course price change audited oldData->newData' ($courseUpdateLog.oldData.price -eq 5000 -and $courseUpdateLog.newData.price -eq 18000)
$loginLog = $logs.data | Where-Object { $_.action -eq 'LOGIN' } | Select-Object -First 1
Test 'LOGIN action audited' ([bool]$loginLog)

# 10. ACTIVITY feed
$act = Invoke-RestMethod "$BASE/activity/recent?limit=5" -Headers $H
Test 'activity recent populated' ($act.data.Count -ge 3)

# 11. NOTIFICATIONS
$n = Invoke-RestMethod "$BASE/notifications" -Headers $H
Test 'notifications list + unreadCount' ($n.data.Count -ge 2 -and $null -ne $n.unreadCount)
Invoke-RestMethod -Method Put "$BASE/notifications/read-all" -Headers $H | Out-Null
$n2 = Invoke-RestMethod "$BASE/notifications" -Headers $H
Test 'mark all read works' ($n2.unreadCount -eq 0) "(unread was $($n.unreadCount))"

# 12. SETTINGS
$s = Invoke-RestMethod "$BASE/settings" -Headers $H
$s2 = Invoke-RestMethod -Method Put "$BASE/settings" -Headers $H -ContentType 'application/json' -Body '{"siteName":"Tevexxo QA","maintenanceMode":true,"notifications":{"paymentReceived":true}}'
Test 'settings GET/PUT persisted' ($s2.data.siteName -eq 'Tevexxo QA' -and $s2.data.maintenanceMode.ToString() -eq 'True' -and $s2.data.notifications.paymentReceived.ToString() -eq 'True')
$s3 = Invoke-RestMethod "$BASE/settings" -Headers $H
Test 'settings persist across requests' ($s3.data.siteName -eq 'Tevexxo QA')
Invoke-RestMethod -Method Put "$BASE/settings" -Headers $H -ContentType 'application/json' -Body '{"siteName":"Tevexxo","maintenanceMode":false}' | Out-Null

# 13. DELETE everything created (also verifies DELETE + audit)
Invoke-RestMethod -Method Delete "$BASE/users/$uid" -Headers $H | Out-Null
Invoke-RestMethod -Method Delete "$BASE/courses/$cid" -Headers $H | Out-Null
Invoke-RestMethod -Method Delete "$BASE/programs/$($p.data.id)" -Headers $H | Out-Null
Invoke-RestMethod -Method Delete "$BASE/projects/$($pr.data.id)" -Headers $H | Out-Null
Invoke-RestMethod -Method Delete "$BASE/inquiries/$($i.data.id)" -Headers $H | Out-Null
Invoke-RestMethod -Method Delete "$BASE/orders/$($o.data.id)" -Headers $H | Out-Null
$list2 = Invoke-RestMethod "$BASE/users" -Headers $H
Test 'DELETE user removes from DB' (-not ($list2.data | Where-Object { $_.id -eq $uid }))
$dlogs = Invoke-RestMethod "$BASE/audit-logs?action=DELETE&limit=50" -Headers $H
Test 'DELETE actions audited with oldData' (($dlogs.data | Where-Object { $_.entity -eq 'USER' }).oldData.name -eq 'Test Learner')

# 14. 404 handler
try { Invoke-RestMethod "$BASE/nonexistent" -Headers $H | Out-Null; Test 'unknown route -> 404 JSON' $false } catch { Test 'unknown route -> 404 JSON' ($_.Exception.Response.StatusCode.value__ -eq 404) }

Write-Output ""
$passed = ($results | Where-Object Pass).Count
Write-Output "==== RESULT: $passed / $($results.Count) passed ===="
