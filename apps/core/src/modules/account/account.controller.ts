import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator'
import { AccountService } from './account.service'

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Public()
  @Post('import-url')
  @HttpCode(HttpStatus.OK)
  async importFromUrl(@Body('url') url: string) {
    return this.accountService.importFromUrl(url)
  }
}
