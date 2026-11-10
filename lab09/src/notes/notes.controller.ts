import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PositiveIntPipe } from '../common/pipes/positive-int.pipe';
import { SortOrderPipe, SortOrder } from '../common/pipes/sort-order.pipe';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('order', SortOrderPipe) order: SortOrder,
  ) {
    return this.notesService.findAll(user.sub, order);
  }

  @Get(':id')
  findOne(@Param('id', PositiveIntPipe) id: number) {
    return this.notesService.findById(id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.notesService.update(id, updateNoteDto, user);
  }
}
